import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brokerId = searchParams.get('broker_id')
  const zonesParam = searchParams.get('zones') // comma-separated

  const supabase = createServerClient()

  // All active property requests
  const { data: requests, error } = await supabase
    .from('buyer_requests')
    .select('id, zones, property_types, budget_usd, created_at')
    .eq('status', 'active')
    .eq('request_type', 'property')

  if (error || !requests) {
    return Response.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }

  // ── Zone demand stats ──────────────────────────────────────────────────────
  const zoneMap: Record<string, { count: number; totalBudget: number; budgetCount: number }> = {}
  for (const req of requests) {
    for (const zone of req.zones ?? []) {
      if (!zoneMap[zone]) zoneMap[zone] = { count: 0, totalBudget: 0, budgetCount: 0 }
      zoneMap[zone].count++
      if (req.budget_usd > 0) {
        zoneMap[zone].totalBudget += req.budget_usd
        zoneMap[zone].budgetCount++
      }
    }
  }
  const zoneStats = Object.entries(zoneMap)
    .map(([zone, { count, totalBudget, budgetCount }]) => ({
      zone,
      count,
      avgBudget: budgetCount > 0 ? Math.round(totalBudget / budgetCount) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  // ── Property type breakdown ────────────────────────────────────────────────
  const typeMap: Record<string, number> = {}
  for (const req of requests) {
    for (const type of req.property_types ?? []) {
      typeMap[type] = (typeMap[type] || 0) + 1
    }
  }

  // ── New this week ──────────────────────────────────────────────────────────
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const newThisWeek = requests.filter(r => new Date(r.created_at) > oneWeekAgo).length

  // ── Overall avg budget ─────────────────────────────────────────────────────
  const budgets = requests.filter(r => r.budget_usd > 0).map(r => r.budget_usd)
  const avgBudget = budgets.length > 0
    ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
    : 0

  // ── Unlocked opportunities for this broker ─────────────────────────────────
  let unlockedOpportunities: { zone: string; count: number }[] = []
  let totalUnlocked = 0

  if (brokerId && zonesParam) {
    const brokerZones = zonesParam.split(',').map(z => z.trim()).filter(Boolean)

    const { data: purchases } = await supabase
      .from('lead_purchases')
      .select('request_id')
      .eq('broker_id', brokerId)

    const purchasedIds = new Set((purchases ?? []).map(p => p.request_id))

    for (const zone of brokerZones) {
      const count = requests.filter(
        r => r.zones?.includes(zone) && !purchasedIds.has(r.id)
      ).length
      if (count > 0) unlockedOpportunities.push({ zone, count })
    }
    unlockedOpportunities.sort((a, b) => b.count - a.count)
    totalUnlocked = unlockedOpportunities.reduce((s, z) => s + z.count, 0)
  }

  return Response.json({
    zoneStats,
    typeBreakdown: typeMap,
    newThisWeek,
    avgBudget,
    totalActive: requests.length,
    unlockedOpportunities,
    totalUnlocked,
  })
}
