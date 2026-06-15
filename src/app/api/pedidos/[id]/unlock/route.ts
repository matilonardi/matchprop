import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// Simple in-process rate limiter (per-IP, resets on cold start)
// Complements the per-broker DB check below.
// ---------------------------------------------------------------------------
const ipHits = new Map<string, { count: number; resetAt: number }>()
const IP_WINDOW_MS = 60 * 60 * 1000  // 1 hour
const IP_MAX       = 30               // max unlock attempts per IP per hour

function checkIpLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipHits.get(ip)
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= IP_MAX
}

// ---------------------------------------------------------------------------
// GET — check if broker already unlocked this request (no credit deducted)
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params
  const brokerUserId = request.nextUrl.searchParams.get('broker_user_id')

  if (!brokerUserId) return Response.json({ unlocked: false })

  const supabase = createServerClient()

  const { data: broker } = await supabase
    .from('broker_profiles')
    .select('id')
    .eq('user_id', brokerUserId)
    .single()

  if (!broker) return Response.json({ unlocked: false })

  const { data: purchase } = await supabase
    .from('lead_purchases')
    .select('id')
    .eq('broker_id', broker.id)
    .eq('request_id', requestId)
    .single()

  if (!purchase) return Response.json({ unlocked: false })

  const { data: req } = await supabase
    .from('buyer_requests')
    .select('contact_name, contact_phone, contact_email')
    .eq('id', requestId)
    .single()

  return Response.json({ unlocked: true, contact: req })
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params

  // ── IP rate limit ──────────────────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (!checkIpLimit(ip)) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo.' },
      { status: 429 }
    )
  }

  // ── Basic validation ───────────────────────────────────────────────────────
  const body = await request.json()
  const { broker_user_id } = body

  if (!broker_user_id || !requestId) {
    return Response.json({ error: 'Parámetros requeridos' }, { status: 400 })
  }

  const supabase = createServerClient()

  // ── Broker profile ─────────────────────────────────────────────────────────
  const { data: broker, error: brokerError } = await supabase
    .from('broker_profiles')
    .select('id, credits, name, agency_name, email')
    .eq('user_id', broker_user_id)
    .single()

  if (brokerError || !broker) {
    return Response.json({ error: 'Perfil de broker no encontrado' }, { status: 404 })
  }

  if (broker.credits < 1) {
    return Response.json({ error: 'Sin créditos suficientes' }, { status: 402 })
  }

  // ── Per-broker rate limit: max 15 unlocks / hour ───────────────────────────
  const oneHourAgo = new Date(Date.now() - IP_WINDOW_MS).toISOString()
  const { count: recentUnlocks } = await supabase
    .from('lead_purchases')
    .select('*', { count: 'exact', head: true })
    .eq('broker_id', broker.id)
    .gte('purchased_at', oneHourAgo)

  if ((recentUnlocks ?? 0) >= 15) {
    return Response.json(
      { error: 'Límite de 15 desbloqueos por hora alcanzado. Podés seguir en un rato.' },
      { status: 429 }
    )
  }

  // ── Already purchased? Return contact without charging ─────────────────────
  const { data: existing } = await supabase
    .from('lead_purchases')
    .select('id')
    .eq('broker_id', broker.id)
    .eq('request_id', requestId)
    .single()

  if (existing) {
    const { data: req } = await supabase
      .from('buyer_requests')
      .select('contact_name, contact_phone, contact_email')
      .eq('id', requestId)
      .single()
    return Response.json({ contact: req })
  }

  // ── Deduct credit ──────────────────────────────────────────────────────────
  // Uses .eq('credits', broker.credits) as optimistic lock —
  // if another request already decremented it, this update affects 0 rows.
  const { data: updatedRows } = await supabase
    .from('broker_profiles')
    .update({ credits: broker.credits - 1 })
    .eq('id', broker.id)
    .eq('credits', broker.credits)  // optimistic lock
    .select('id')
  const updated = updatedRows?.length ?? 0

  if (!updated || updated === 0) {
    // Concurrent request already decremented — re-read and check
    const { data: fresh } = await supabase
      .from('broker_profiles')
      .select('credits')
      .eq('id', broker.id)
      .single()

    if (!fresh || fresh.credits < 1) {
      return Response.json({ error: 'Sin créditos suficientes' }, { status: 402 })
    }
    // Retry once with fresh value
    await supabase
      .from('broker_profiles')
      .update({ credits: fresh.credits - 1 })
      .eq('id', broker.id)
      .eq('credits', fresh.credits)
  }

  // ── Record purchase & transaction ──────────────────────────────────────────
  await supabase.from('lead_purchases').insert({
    broker_id: broker.id,
    request_id: requestId,
    credits_spent: 1,
  })

  await supabase.from('credit_transactions').insert({
    broker_id: broker.id,
    amount: -1,
    description: `Lead desbloqueado: ${requestId}`,
  })

  await supabase.rpc('increment_request_views', { req_id: requestId })

  // ── Fetch full request for email ───────────────────────────────────────────
  const { data: req } = await supabase
    .from('buyer_requests')
    .select('contact_name, contact_phone, contact_email, property_types, zones, budget_usd, request_type')
    .eq('id', requestId)
    .single()

  // ── Notify buyer (non-blocking) ────────────────────────────────────────────
  if (req?.contact_email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY || '')
      const brokerDisplay = broker.agency_name
        ? `${broker.name} (${broker.agency_name})`
        : broker.name || 'Un interesado'
      const zones = (req.zones || []).slice(0, 3).join(', ')
      const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'}/pedidos/${requestId}`

      await resend.emails.send({
        from: 'Propi <alertas@matchprop.com.ar>',
        to: req.contact_email,
        subject: `📬 ${brokerDisplay} está interesado en tu búsqueda`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">
                <span style="color:#fb923c;">prop</span><span style="color:#f97316;">i</span>
              </p>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">Alguien desbloqueó tu contacto</p>
            </div>
            <div style="padding:28px 32px;">
              <h2 style="margin:0 0 8px;font-size:18px;color:#111827;">¡Tenés un interesado en tu búsqueda!</h2>
              <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">
                Un profesional inmobiliario vio tu búsqueda y desbloqueó tu contacto para comunicarse con vos.
              </p>
              <div style="background:#eff6ff;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 4px;font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Quién se contactó</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#1e40af;">${brokerDisplay}</p>
              </div>
              <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Tu búsqueda</p>
                <p style="margin:0;font-size:14px;color:#374151;">
                  📍 ${zones}${(req.zones?.length ?? 0) > 3 ? ` +${req.zones.length - 3}` : ''} &nbsp;·&nbsp; 💰 USD ${req.budget_usd?.toLocaleString('es-AR') || '—'}
                </p>
              </div>
              <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">
                Tu teléfono y email son los que registraste al publicar la búsqueda. Podés esperar que te contacten directamente, o entrá a la plataforma para ver más detalles.
              </p>
              <a href="${requestUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Ver mi búsqueda →
              </a>
            </div>
            <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Recibís este mail porque publicaste una búsqueda en Propi. Si no fuiste vos, ignorá este mensaje.
              </p>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.error('[unlock] email error:', e)
    }
  }

  return Response.json({
    contact: {
      contact_name: req?.contact_name,
      contact_phone: req?.contact_phone,
      contact_email: req?.contact_email,
    },
  })
}
