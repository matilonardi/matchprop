import { NextRequest } from 'next/server'
import { CREDIT_PACKS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const { pack_id } = await request.json()

  const pack = CREDIT_PACKS.find((p) => p.id === pack_id)
  if (!pack) {
    return Response.json({ error: 'Pack no encontrado' }, { status: 400 })
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
  if (!MP_ACCESS_TOKEN) {
    return Response.json({ error: 'MercadoPago no configurado' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const body = {
    items: [
      {
        title: `MatchProp – ${pack.label}`,
        description: `${pack.credits} créditos para desbloquear contactos de compradores`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: pack.price_usd * 1000, // rough ARS conversion — should use real FX
      },
    ],
    back_urls: {
      success: `${appUrl}/broker/dashboard?credits_added=1`,
      failure: `${appUrl}/broker/creditos?error=1`,
      pending: `${appUrl}/broker/creditos?pending=1`,
    },
    auto_return: 'approved',
    external_reference: `${pack_id}_${Date.now()}`,
    notification_url: `${appUrl}/api/checkout/webhook`,
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    return Response.json({ error: `MercadoPago error: ${err}` }, { status: 500 })
  }

  const preference = await res.json()
  return Response.json({ init_point: preference.init_point })
}
