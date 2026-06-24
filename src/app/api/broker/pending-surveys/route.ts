import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const brokerId = request.nextUrl.searchParams.get('broker_id')
  if (!brokerId) return Response.json({ error: 'broker_id required' }, { status: 400 })

  const supabase = createServerClient()

  const cutoff = new Date(Date.now() - TEN_DAYS_MS).toISOString()

  const { data: purchases } = await supabase
    .from('lead_purchases')
    .select('id, purchased_at, request_id')
    .eq('broker_id', brokerId)
    .is('outcome', null)
    .lte('purchased_at', cutoff)
    .order('purchased_at', { ascending: true })
    .limit(10)

  if (!purchases?.length) return Response.json({ surveys: [] })

  const requestIds = purchases.map(p => p.request_id)
  const { data: requests } = await supabase
    .from('buyer_requests')
    .select('id, property_types, zones, budget_usd, contact_name, status')
    .in('id', requestIds)

  const reqMap = Object.fromEntries((requests || []).map(r => [r.id, r]))

  const surveys = purchases.map(p => ({
    lead_id: p.id,
    purchased_at: p.purchased_at,
    request: reqMap[p.request_id] ?? null,
  }))

  return Response.json({ surveys })
}
