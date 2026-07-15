import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { CREDIT_PACKS } from '@/lib/constants'
import { createHmac, timingSafeEqual } from 'crypto'

const MP_FETCH_TIMEOUT_MS = 8_000

// ---------------------------------------------------------------------------
// Verify MercadoPago's webhook signature (x-signature / x-request-id headers).
// Spec: https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks#editor_5
//
// MP_WEBHOOK_SECRET isn't configured in this project yet (only MP_ACCESS_TOKEN
// / MP_PUBLIC_KEY are) — until it's added in Vercel + the MP dashboard, this
// check is a documented no-op rather than a hard block, because we can't
// verify a signature without the secret. Once MP_WEBHOOK_SECRET is set, any
// unsigned/mis-signed request is rejected.
// ---------------------------------------------------------------------------
function verifyMpSignature(request: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[checkout/webhook] MP_WEBHOOK_SECRET not configured — skipping signature check')
    return true
  }

  const signatureHeader = request.headers.get('x-signature') || ''
  const requestId = request.headers.get('x-request-id') || ''
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.trim().split('=').map((s) => s.trim()) as [string, string])
  )
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.type !== 'payment') {
    return Response.json({ ok: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return Response.json({ ok: true })

  if (!verifyMpSignature(request, String(paymentId))) {
    console.error('[checkout/webhook] invalid signature for payment', paymentId)
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

  // Fetch payment details directly from MercadoPago (source of truth — never
  // trust status/amount/payer fields from the webhook body itself), bounded
  // by a timeout so a slow MP API response can't hang this route indefinitely.
  let payment: { status?: string; external_reference?: string; payer?: { email?: string } }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), MP_FETCH_TIMEOUT_MS)
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))
    if (!res.ok) {
      console.error('[checkout/webhook] MP payment fetch failed:', res.status, paymentId)
      return Response.json({ error: 'Upstream error' }, { status: 502 })
    }
    payment = await res.json()
  } catch (e) {
    console.error('[checkout/webhook] MP payment fetch errored:', e, paymentId)
    return Response.json({ error: 'Upstream timeout' }, { status: 504 })
  }

  if (payment.status !== 'approved') {
    return Response.json({ ok: true })
  }

  const externalRef: string = payment.external_reference || ''

  // ── Feature payment: external_reference = "feature_{requestId}_{timestamp}"
  if (externalRef.startsWith('feature_')) {
    const withoutPrefix = externalRef.slice('feature_'.length)
    const lastUnderscore = withoutPrefix.lastIndexOf('_')
    const requestId = withoutPrefix.slice(0, lastUnderscore)
    if (requestId) {
      const featuredUntil = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
      const supabase = createServerClient()
      await supabase
        .from('buyer_requests')
        .update({ featured_until: featuredUntil })
        .eq('id', requestId)
    }
    return Response.json({ ok: true })
  }

  // ── Credit pack payment: external_reference = "pack_20_1716987654321"
  const packId = externalRef.split('_').slice(0, 2).join('_')
  const pack = CREDIT_PACKS.find((p) => p.id === packId)

  if (!pack) return Response.json({ ok: true })

  // Find broker by payer email
  const payerEmail = payment.payer?.email
  if (!payerEmail) return Response.json({ ok: true })

  const supabase = createServerClient()
  const { data: broker } = await supabase
    .from('broker_profiles')
    .select('id, credits')
    .eq('email', payerEmail)
    .single()

  if (!broker) return Response.json({ ok: true })

  // Idempotency: MercadoPago can (and does) redeliver the same webhook
  // notification more than once. Without this check, a redelivery — or a
  // replayed/guessed payment id for an already-processed approved payment —
  // would credit the broker again for the same real-world payment.
  const { data: alreadyProcessed } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('mp_payment_id', String(paymentId))
    .maybeSingle()

  if (alreadyProcessed) {
    return Response.json({ ok: true, duplicate: true })
  }

  // Expiry: 30 days from now
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // For unlimited plan: set to 999 credits (effectively unlimited for 30 days)
  const newCredits = pack.unlimited
    ? 999
    : broker.credits + pack.credits

  await supabase
    .from('broker_profiles')
    .update({ credits: newCredits })
    .eq('id', broker.id)

  await supabase.from('credit_transactions').insert({
    broker_id: broker.id,
    amount: pack.credits,
    description: pack.unlimited
      ? `Plan Ilimitado mensual — vence ${new Date(expiresAt).toLocaleDateString('es-AR')}`
      : `Compra: ${pack.label} — vencen ${new Date(expiresAt).toLocaleDateString('es-AR')}`,
    mp_payment_id: String(paymentId),
  })

  return Response.json({ ok: true })
}
