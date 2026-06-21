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
    .select('id, name, agency_name, credits, zones, email, phone')
    .eq('user_id', userId)
    .single()

  if (brokerError || !broker) {
    return Response.json({ error: 'Broker not found' }, { status: 404 })
  }

  // Fetch purchases
  const { data: purchases } = await supabase
    .from('lead_purchases')
    .select('id, request_id, credits_spent, purchased_at')
    .eq('broker_id', broker.id)
    .order('purchased_at', { ascending: false })
    .limit(20)

  let leads: object[] = []
  if (purchases && purchases.length > 0) {
    const requestIds = purchases.map((p) => p.request_id)

    const [{ data: requestsData }, { data: messagesData }] = await Promise.all([
      supabase
        .from('buyer_requests')
        .select('id, property_types, zones, budget_usd, contact_name, contact_phone, contact_email, bedrooms_min, bedrooms_max, description')
        .in('id', requestIds),
      supabase
        .from('messages')
        .select('request_id, sender_type, read_at')
        .in('request_id', requestIds)
        .eq('broker_id', broker.id),
    ])

    // Build per-request message stats
    const msgStats: Record<string, { total: number; unread: number }> = {}
    for (const m of messagesData || []) {
      if (!msgStats[m.request_id]) msgStats[m.request_id] = { total: 0, unread: 0 }
      msgStats[m.request_id].total++
      if (m.sender_type === 'buyer' && !m.read_at) {
        msgStats[m.request_id].unread++
      }
    }

    leads = purchases.map((p) => ({
      ...p,
      request: requestsData?.find((r) => r.id === p.request_id) || null,
      total_messages: msgStats[p.request_id]?.total ?? 0,
      unread_count: msgStats[p.request_id]?.unread ?? 0,
    }))
  }

  return Response.json({ broker, leads })
}
