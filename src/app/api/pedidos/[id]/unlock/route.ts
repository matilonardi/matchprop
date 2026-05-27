import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params
  const { broker_user_id } = await request.json()

  if (!broker_user_id || !requestId) {
    return Response.json({ error: 'Parámetros requeridos' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Get broker profile (include name, agency, email for notification)
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

  // Check if already purchased
  const { data: existing } = await supabase
    .from('lead_purchases')
    .select('id')
    .eq('broker_id', broker.id)
    .eq('request_id', requestId)
    .single()

  if (existing) {
    // Already purchased — return contact anyway
    const { data: req } = await supabase
      .from('buyer_requests')
      .select('contact_name, contact_phone, contact_email')
      .eq('id', requestId)
      .single()
    return Response.json({ contact: req })
  }

  // Deduct credit and record purchase atomically
  const { error: deductError } = await supabase
    .from('broker_profiles')
    .update({ credits: broker.credits - 1 })
    .eq('id', broker.id)

  if (deductError) {
    return Response.json({ error: 'Error al descontar crédito' }, { status: 500 })
  }

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

  // Update leads_count on the request
  await supabase.rpc('increment_request_views', { req_id: requestId })

  // Fetch full request data (contact + type info for the email)
  const { data: req } = await supabase
    .from('buyer_requests')
    .select('contact_name, contact_phone, contact_email, property_types, zones, budget_usd, request_type')
    .eq('id', requestId)
    .single()

  // Send notification email to the buyer (non-blocking)
  if (req?.contact_email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY || '')
      const brokerDisplay = broker.agency_name
        ? `${broker.name} (${broker.agency_name})`
        : broker.name || 'Un interesado'
      const zones = (req.zones || []).slice(0, 3).join(', ')
      const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'}/pedidos/${requestId}`

      await resend.emails.send({
        from: 'MatchProp <alertas@matchprop.com.ar>',
        to: req.contact_email,
        subject: `📬 ${brokerDisplay} está interesado en tu búsqueda`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">
                <span style="color:#fb923c;">Match</span>Prop
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
                  📍 ${zones}${req.zones?.length > 3 ? ` +${req.zones.length - 3}` : ''} &nbsp;·&nbsp; 💰 USD ${req.budget_usd?.toLocaleString('es-AR') || '—'}
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
                Recibís este mail porque publicaste una búsqueda en MatchProp. Si no fuiste vos, ignorá este mensaje.
              </p>
            </div>
          </div>
        `,
      })
    } catch (e) {
      console.error('[unlock] email error:', e)
    }
  }

  return Response.json({ contact: { contact_name: req?.contact_name, contact_phone: req?.contact_phone, contact_email: req?.contact_email } })
}
