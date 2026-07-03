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
    budget_ars,
    financing,
    description,
    contact_name,
    contact_phone,
    operation_type,
    source_message_id,
  } = body

  // Validación mínima
  if (!zones?.length || !contact_phone) {
    return Response.json({ error: 'Faltan campos mínimos: zones y contact_phone' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Anti-duplicado determinístico: si el mensaje de WhatsApp ya se cargó, no repetir.
  // Inmune a la variación del parser LLM entre corridas.
  if (source_message_id) {
    const { data: alreadyLoaded } = await supabase
      .from('buyer_requests')
      .select('id')
      .eq('source_message_id', source_message_id)
      .maybeSingle()

    if (alreadyLoaded) {
      return Response.json({ id: alreadyLoaded.id, duplicate: true }, { status: 200 })
    }
  }

  // Anti-duplicado: mismo teléfono + misma zona principal + mismo tipo en las últimas 2 horas
  // Permite que una persona publique múltiples búsquedas distintas
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const firstZone = zones?.[0] || ''
  const firstType = property_types?.[0] || ''
  const { data: allRecent } = await supabase
    .from('buyer_requests')
    .select('id, zones, property_types, created_at')
    .eq('contact_phone', contact_phone)
    .gte('created_at', twoHoursAgo)

  const existing = (allRecent || []).find((r) => {
    const sameZone = r.zones?.includes(firstZone)
    const sameType = !firstType || r.property_types?.includes(firstType)
    return sameZone && sameType
  })

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
      operation_type: operation_type || 'compra',
      budget_usd:     budget_usd    || 0,
      budget_ars:     budget_ars    || null,
      financing:      financing     || 'efectivo',
      financing_types: financing ? [financing] : [],
      requirements:   [],
      description:    description   || null,
      contact_name:   contact_name  || 'Inmobiliaria',
      contact_phone,
      publisher_type: 'inmobiliaria',
      status:         'active',
      source_message_id: source_message_id || null,
    })
    .select('id')
    .single()

  if (error) {
    // Backstop: la constraint única de source_message_id atrapa carreras entre corridas.
    // Postgres devuelve código 23505 en violación de índice único.
    if (error.code === '23505') {
      const { data: existingByMsg } = await supabase
        .from('buyer_requests')
        .select('id')
        .eq('source_message_id', source_message_id)
        .maybeSingle()
      return Response.json({ id: existingByMsg?.id || null, duplicate: true }, { status: 200 })
    }
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
