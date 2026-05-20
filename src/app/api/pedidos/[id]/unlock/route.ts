import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params
  const { broker_user_id } = await request.json()

  if (!broker_user_id || !requestId) {
    return Response.json({ error: 'Parámetros requeridos' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Get broker profile
  const { data: broker, error: brokerError } = await supabase
    .from('broker_profiles')
    .select('id, credits')
    .eq('user_id', broker_user_id)
    .single()

  if (brokerError || !broker) {
    return Response.json({ error: 'Perfil de broker no encontrado' }, { status: 404 })
  }

  if (broker.credits < 1) {
    return Response.json({ error: 'Sin créditos suficientes' }, { status: 402 })
  }

  // Check if already purchased
  const { data: existing } = await supabase
    .from('lead_purchases')
    .select('id')
    .eq('broker_id', broker.id)
    .eq('request_id', requestId)
    .single()

  if (existing) {
    // Already purchased — return contact anyway
    const { data: req } = await supabase
      .from('buyer_requests')
      .select('contact_name, contact_phone, contact_email')
      .eq('id', requestId)
      .single()
    return Response.json({ contact: req })
  }

  // Deduct credit and record purchase atomically
  const { error: deductError } = await supabase
    .from('broker_profiles')
    .update({ credits: broker.credits - 1 })
    .eq('id', broker.id)

  if (deductError) {
    return Response.json({ error: 'Error al descontar crédito' }, { status: 500 })
  }

  await supabase.from('lead_purchases').insert({
    broker_id: broker.id,
    request_id: requestId,
    credits_spent: 1,
  })

  await supabase.from('credit_transactions').insert({
    broker_id: broker.id,
    amount: -1,
    description: `Lead desbloqueado: ${requestId}`,
  })

  // Update leads_count on the request
  await supabase.rpc('increment_request_views', { req_id: requestId })

  // Return contact
  const { data: req } = await supabase
    .from('buyer_requests')
    .select('contact_name, contact_phone, contact_email')
    .eq('id', requestId)
    .single()

  return Response.json({ contact: req })
}
