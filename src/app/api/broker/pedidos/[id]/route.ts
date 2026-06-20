import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { userId, action, ...fields } = body

  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  const supabase = createServerClient()

  // Resolve broker
  const { data: broker, error: brokerError } = await supabase
    .from('broker_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (brokerError || !broker) return Response.json({ error: 'Broker not found' }, { status: 404 })

  // Verify ownership
  const { data: pedido, error: pedidoError } = await supabase
    .from('buyer_requests')
    .select('id, status')
    .eq('id', id)
    .eq('publisher_broker_id', broker.id)
    .single()

  if (pedidoError || !pedido) return Response.json({ error: 'Pedido not found' }, { status: 404 })

  if (action === 'close') {
    const { error } = await supabase
      .from('buyer_requests')
      .update({ status: 'closed' })
      .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  // Field update — only allow safe fields
  const allowed = ['contact_name', 'contact_phone', 'zones', 'budget_usd', 'property_types', 'description', 'bedrooms_min', 'bedrooms_max', 'urgency']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key]
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { error } = await supabase
    .from('buyer_requests')
    .update(update)
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
