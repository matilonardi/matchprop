import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

async function resolveBroker(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data, error } = await supabase
    .from('broker_profiles')
    .select('id, name, agency_name')
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return data
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  const supabase = createServerClient()
  const broker = await resolveBroker(supabase, userId)
  if (!broker) return Response.json({ error: 'Broker not found' }, { status: 404 })

  const { data: pedidos, error } = await supabase
    .from('buyer_requests')
    .select('id, property_types, zones, budget_usd, contact_name, contact_phone, bedrooms_min, bedrooms_max, description, status, created_at')
    .eq('publisher_broker_id', broker.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ pedidos: pedidos ?? [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, ...fields } = body

  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
  if (!fields.contact_name || !fields.contact_phone) {
    return Response.json({ error: 'contact_name y contact_phone requeridos' }, { status: 400 })
  }
  if (!fields.property_types?.length || !fields.zones?.length || !fields.budget_usd) {
    return Response.json({ error: 'Faltan campos obligatorios del pedido' }, { status: 400 })
  }

  const supabase = createServerClient()
  const broker = await resolveBroker(supabase, userId)
  if (!broker) return Response.json({ error: 'Broker not found' }, { status: 404 })

  const { data: pedido, error } = await supabase
    .from('buyer_requests')
    .insert({
      request_type: 'property',
      property_types: fields.property_types,
      zones: fields.zones,
      bedrooms_min: fields.bedrooms_min ?? null,
      bedrooms_max: fields.bedrooms_max ?? null,
      bathrooms_min: fields.bathrooms_min ?? null,
      budget_usd: fields.budget_usd,
      financing: fields.financing ?? null,
      financing_types: fields.financing_types ?? [],
      description: fields.description ?? null,
      urgency: fields.urgency ?? null,
      requirements: fields.requirements ?? [],
      contact_name: fields.contact_name,
      contact_phone: fields.contact_phone,
      contact_email: null,
      publisher_type: 'inmobiliaria',
      publisher_broker_id: broker.id,
      agency_name: broker.agency_name ?? null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ id: pedido.id }, { status: 201 })
}
