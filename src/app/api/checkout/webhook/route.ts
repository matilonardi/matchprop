import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { CREDIT_PACKS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.type !== 'payment') {
    return Response.json({ ok: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return Response.json({ ok: true })

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

  // Fetch payment details from MercadoPago
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })
  const payment = await res.json()

  if (payment.status !== 'approved') {
    return Response.json({ ok: true })
  }

  // Parse external_reference: "pack_20_1716987654321"
  const externalRef: string = payment.external_reference || ''
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
