import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getAuthenticatedBroker } from '@/lib/broker-auth'
import { makeCloseToken, verifyCloseToken } from '@/lib/close-token'

async function sendEmailNotification({
  to,
  toName,
  subject,
  message,
  requestId,
  closeToken,
}: {
  to: string
  toName: string
  subject: string
  message: string
  requestId: string
  closeToken?: string
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key') return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'
  const link = closeToken
    ? `${appUrl}/pedidos/${requestId}?close_token=${closeToken}#mensajes`
    : `${appUrl}/pedidos/${requestId}`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Demandi <noreply@demandi.com.ar>',
        to: [to],
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
            <h2 style="color:#f97316;margin-bottom:4px">Demandi</h2>
            <p style="color:#374151">Hola <strong>${toName}</strong>,</p>
            <p style="color:#374151">${message}</p>
            <a href="${link}"
               style="display:inline-block;margin-top:16px;background:#f97316;color:#fff;
                      padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Ver mensaje →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              Demandi · Córdoba, Argentina
            </p>
          </div>
        `,
      }),
    })
    if (!res.ok) {
      console.error('[pedidos/messages] email notification failed:', res.status, to)
    }
  } catch (e) {
    // Non-blocking by design (caller doesn't await user-visible state on this),
    // but must not vanish silently — a lost message notification is invisible
    // to both the buyer/broker and to us unless it's logged.
    console.error('[pedidos/messages] email notification errored:', e, to)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pedidos/[id]/messages?close_token=xxx  (buyer)
// GET /api/pedidos/[id]/messages                  (broker, auth session)
// ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await params
  const closeToken = request.nextUrl.searchParams.get('close_token')
  const supabase = createServerClient()

  // Auth: either valid close_token (buyer) or authenticated broker who unlocked
  if (closeToken) {
    if (!verifyCloseToken(requestId, closeToken)) {
      return Response.json({ error: 'Token inválido' }, { status: 403 })
    }

    // Mark all broker messages as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .eq('sender_type', 'broker')
      .is('read_at', null)
  } else {
    // Broker auth: identity comes from the verified access token, never
    // from a client-supplied broker_user_id (that was an IDOR: anyone who
    // knew a broker's user id could read/mark-read their conversations).
    const auth = await getAuthenticatedBroker(supabase, request)
    if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 })
    const resolvedBrokerId = auth.brokerId

    // Verify they've unlocked this request
    const { data: purchase } = await supabase
      .from('lead_purchases')
      .select('id')
      .eq('broker_id', resolvedBrokerId)
      .eq('request_id', requestId)
      .single()

    if (!purchase) return Response.json({ error: 'No desbloqueaste este contacto' }, { status: 403 })

    // Mark buyer messages as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .eq('broker_id', resolvedBrokerId)
      .eq('sender_type', 'buyer')
      .is('read_at', null)
  }

  // For broker auth: only fetch their own conversation thread
  let msgsQuery = supabase
    .from('messages')
    .select('id, sender_type, content, created_at, read_at, broker_id, broker_profiles(name)')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  // When fetched by buyer (closeToken), return all messages
  // When fetched by broker, filter to their conversation only.
  // Re-verify via the access token rather than trusting a query param.
  if (!closeToken) {
    const auth = await getAuthenticatedBroker(supabase, request)
    if (auth) {
      msgsQuery = msgsQuery.eq('broker_id', auth.brokerId) as typeof msgsQuery
    }
  }

  const { data: rawMsgs, error } = await msgsQuery

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const msgs = (rawMsgs || []).map(m => {
    const profiles = m.broker_profiles as unknown
    const brokerName = profiles
      ? ((Array.isArray(profiles) ? profiles[0] : profiles) as { name: string } | null)?.name ?? null
      : null
    return {
      id: m.id,
      sender_type: m.sender_type,
      content: m.content,
      created_at: m.created_at,
      read_at: m.read_at,
      broker_id: m.broker_id ?? null,
      broker_name: brokerName,
    }
  })

  return Response.json({ messages: msgs })
}

// ─────────────────────────────────────────────────────────────
// POST /api/pedidos/[id]/messages
// Body: { content } (broker, authenticated via Bearer token) or { content, close_token } (buyer)
// ─────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await params
  const { content, close_token, reply_to_broker_id } = await request.json()

  if (!content?.trim()) {
    return Response.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  const supabase = createServerClient()

  // ── Buyer reply (close_token auth) ──────────────────────────
  if (close_token) {
    if (!verifyCloseToken(requestId, close_token)) {
      return Response.json({ error: 'Token inválido' }, { status: 403 })
    }

    const { error } = await supabase.from('messages').insert({
      request_id: requestId,
      broker_id: reply_to_broker_id || null, // links reply to the specific broker thread
      sender_type: 'buyer',
      content: content.trim(),
    })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Notify all brokers who unlocked this request
    const { data: purchases } = await supabase
      .from('lead_purchases')
      .select('broker_id, broker_profiles(name, email)')
      .eq('request_id', requestId)

    const { data: req } = await supabase
      .from('buyer_requests')
      .select('contact_name')
      .eq('id', requestId)
      .single()

    if (purchases) {
      for (const p of purchases) {
        const profiles = p.broker_profiles as unknown
        const broker = (Array.isArray(profiles) ? profiles[0] : profiles) as { name: string; email: string } | null
        if (broker?.email) {
          await sendEmailNotification({
            to: broker.email,
            toName: broker.name,
            subject: `Nueva respuesta de ${req?.contact_name || 'un comprador'} — Demandi`,
            message: `El comprador respondió tu mensaje en la búsqueda que desbloqueaste. Hacé click para ver la conversación.`,
            requestId,
          })
        }
      }
    }

    return Response.json({ ok: true })
  }

  // ── Broker message ───────────────────────────────────────────
  const auth = await getAuthenticatedBroker(supabase, request)
  if (!auth) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: broker } = await supabase
    .from('broker_profiles')
    .select('id, name, email')
    .eq('id', auth.brokerId)
    .single()

  if (!broker) return Response.json({ error: 'Broker no encontrado' }, { status: 404 })

  // Must have unlocked this request
  const { data: purchase } = await supabase
    .from('lead_purchases')
    .select('id')
    .eq('broker_id', broker.id)
    .eq('request_id', requestId)
    .single()

  if (!purchase) {
    return Response.json({ error: 'Primero desbloqueá el contacto para enviar mensajes' }, { status: 403 })
  }

  const { error } = await supabase.from('messages').insert({
    request_id: requestId,
    broker_id: broker.id,
    sender_type: 'broker',
    content: content.trim(),
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Notify buyer by email
  const { data: req } = await supabase
    .from('buyer_requests')
    .select('contact_name, contact_email')
    .eq('id', requestId)
    .single()

  if (req?.contact_email) {
    const closeToken = makeCloseToken(requestId)
    await sendEmailNotification({
      to: req.contact_email,
      toName: req.contact_name,
      subject: `Tenés un mensaje pendiente en tu búsqueda — Demandi`,
      message: `Un interesado en tu búsqueda te envió un mensaje a través de Demandi. Hacé click para leerlo y responder.`,
      requestId,
      closeToken,
    })
  }

  return Response.json({ ok: true })
}
