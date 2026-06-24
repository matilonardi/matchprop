import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const { request_id } = await request.json()

  if (!request_id) {
    return Response.json({ error: 'request_id requerido' }, { status: 400 })
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
  if (!MP_ACCESS_TOKEN) {
    return Response.json({ error: 'MercadoPago no configurado' }, { status: 500 })
  }

  // Verify the request exists and is active
  const supabase = createServerClient()
  const { data: req } = await supabase
    .from('buyer_requests')
    .select('id, status')
    .eq('id', request_id)
    .single()

  if (!req || req.status !== 'active') {
    return Response.json({ error: 'Búsqueda no encontrada o inactiva' }, { status: 404 })
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1')

  const body: Record<string, unknown> = {
    items: [
      {
        title: 'MatchProp – Búsqueda Destacada',
        description: 'Tu búsqueda aparece primero en el feed durante 45 días, con badge dorado.',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: 15000,
      },
    ],
    back_urls: {
      success: `${appUrl}/pedidos/${request_id}?destacado=1`,
      failure: `${appUrl}/pedidos/${request_id}?destacado_error=1`,
      pending: `${appUrl}/pedidos/${request_id}?destacado_pending=1`,
    },
    // external_reference: "feature_{requestId}_{timestamp}" — parsed in webhook
    external_reference: `feature_${request_id}_${Date.now()}`,
    ...(!isLocalhost && { auto_return: 'approved' }),
    ...(!isLocalhost && { notification_url: `${appUrl}/api/checkout/webhook` }),
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
