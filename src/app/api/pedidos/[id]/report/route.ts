import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const VALID_REASONS = [
  'vendida',
  'contacto_incorrecto',
  'falso',
  'cliente_encontro',
  'otro',
]

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params
  const body = await request.json()
  const { broker_user_id, reason } = body

  if (!broker_user_id || !requestId) {
    return Response.json({ error: 'Parámetros requeridos' }, { status: 400 })
  }

  if (!VALID_REASONS.includes(reason)) {
    return Response.json({ error: 'Motivo inválido' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: broker } = await supabase
    .from('broker_profiles')
    .select('id')
    .eq('user_id', broker_user_id)
    .single()

  if (!broker) {
    return Response.json({ error: 'Broker no encontrado' }, { status: 404 })
  }

  // Only brokers who unlocked this contact can report it
  const { data: purchase } = await supabase
    .from('lead_purchases')
    .select('id')
    .eq('broker_id', broker.id)
    .eq('request_id', requestId)
    .single()

  if (!purchase) {
    return Response.json({ error: 'Solo podés reportar pedidos que hayas desbloqueado' }, { status: 403 })
  }

  // 1 report per broker per request
  const { data: existing } = await supabase
    .from('request_reports')
    .select('id')
    .eq('broker_id', broker.id)
    .eq('request_id', requestId)
    .single()

  if (existing) {
    return Response.json({ error: 'Ya reportaste este pedido' }, { status: 409 })
  }

  const { error } = await supabase.from('request_reports').insert({
    request_id: requestId,
    broker_id: broker.id,
    reason,
    status: 'pending',
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
