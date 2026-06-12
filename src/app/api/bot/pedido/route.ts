import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createHmac } from 'crypto'

function makeCloseToken(requestId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createHmac('sha256', secret).update(requestId).digest('hex').slice(0, 32)
}

export async function POST(request: NextRequest) {
  // Verificar bot secret
  const BOT_SECRET = process.env.BOT_SECRET || ''
  const provided   = request.headers.get('x-bot-secret') || ''

  if (!BOT_SECRET || provided !== BOT_SECRET) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()

  const {
    request_type,
    property_types,
    zones,
    bedrooms_min,
    bedrooms_max,
    bathrooms_min,
    budget_usd,
    financing,
    description,
    contact_name,
    contact_phone,
  } = body

  // Validación mínima
  if (!zones?.length || !contact_phone) {
    return Response.json({ error: 'Faltan campos mínimos: zones y contact_phone' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Anti-duplicado: si ya existe un pedido del mismo teléfono en las últimas 2 horas, rechazar
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('buyer_requests')
    .select('id, created_at')
    .eq('contact_phone', contact_phone)
    .gte('created_at', twoHoursAgo)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return Response.json({ id: existing.id, duplicate: true }, { status: 200 })
  }

  const { data, error } = await supabase
    .from('buyer_requests')
    .insert({
      request_type:   request_type || 'property',
      property_types: property_types || [],
      zones,
      bedrooms_min:   bedrooms_min  || null,
      bedrooms_max:   bedrooms_max  || null,
      bathrooms_min:  bathrooms_min || null,
      budget_usd:     budget_usd    || 0,
      financing:      financing     || 'efectivo',
      financing_types: financing ? [financing] : [],
      requirements:   [],
      description:    description   || null,
      contact_name:   contact_name  || 'Inmobiliaria',
      contact_phone,
      publisher_type: 'inmobiliaria',
      status:         'active',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[bot/pedido] Supabase error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  // AI matching en background (no bloqueante)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'
    fetch(`${appUrl}/api/matching`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ request_id: data.id }),
    }).catch(() => {})
  } catch {}

  const close_token = makeCloseToken(data.id)
  return Response.json({ id: data.id, close_token }, { status: 201 })
}
