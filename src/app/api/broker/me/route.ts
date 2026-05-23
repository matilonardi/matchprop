import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: broker, error: brokerError } = await supabase
    .from('broker_profiles')
    .select('id, name, agency_name, credits, zones, email')
    .eq('user_id', userId)
    .single()

  if (brokerError || !broker) {
    return Response.json({ error: 'Broker not found' }, { status: 404 })
  }

  // Fetch purchases
  const { data: purchases } = await supabase
    .from('lead_purchases')
    .select('id, request_id, credits_spent, created_at')
    .eq('broker_id', broker.id)
    .order('created_at', { ascending: false })
    .limit(20)

  let leads: object[] = []
  if (purchases && purchases.length > 0) {
    const requestIds = purchases.map((p) => p.request_id)
    const { data: requestsData } = await supabase
      .from('buyer_requests')
      .select('id, property_types, zones, budget_usd, contact_name, contact_phone, contact_email')
      .in('id', requestIds)

    leads = purchases.map((p) => ({
      ...p,
      request: requestsData?.find((r) => r.id === p.request_id) || null,
    }))
  }

  return Response.json({ broker, leads })
}
