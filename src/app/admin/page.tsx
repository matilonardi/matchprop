import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import {
  Users, FileText, ShoppingCart, BarChart3,
  CreditCard, DollarSign, TrendingUp, UserCheck,
} from 'lucide-react'
import AdminTable from './AdminTable'
import AdminUsersTable from './AdminUsersTable'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; tab?: string }>
}) {
  const params = await searchParams

  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  if (params.key !== ADMIN_SECRET) {
    redirect('/?error=unauthorized')
  }

  const tab = params.tab || 'requests'
  const supabase = createServerClient()

  const [
    { data: requests },
    { data: brokers },
    { data: buyers },
    { data: leadPurchases },
    { count: buyerCount },
  ] = await Promise.all([
    // All buyer requests
    supabase
      .from('buyer_requests')
      .select(
        'id, request_type, contact_name, contact_email, contact_phone, zones, budget_usd, status, views_count, created_at'
      )
      .order('created_at', { ascending: false }),

    // Brokers with their lead purchase counts
    supabase
      .from('broker_profiles')
      .select('id, name, agency_name, email, phone, zones, credits, created_at'),

    // Buyer profiles with request counts
    supabase
      .from('buyer_profiles')
      .select('id, user_id, name, phone, created_at'),

    // All lead purchases for calculating broker spend
    supabase
      .from('lead_purchases')
      .select('id, broker_id, credits_spent, purchased_at'),

    // Buyer count
    supabase
      .from('buyer_profiles')
      .select('id', { count: 'exact', head: true }),
  ])

  // Aggregate lead purchases per broker
  const purchasesByBroker = new Map<string, { count: number; creditsSpent: number }>()
  for (const p of leadPurchases || []) {
    const existing = purchasesByBroker.get(p.broker_id) || { count: 0, creditsSpent: 0 }
    purchasesByBroker.set(p.broker_id, {
      count: existing.count + 1,
      creditsSpent: existing.creditsSpent + (p.credits_spent || 1),
    })
  }

  // Aggregate requests per buyer_user_id
  const requestsByUserId = new Map<string, { total: number; property: number; car: number }>()
  for (const r of requests || []) {
    // buyer_user_id isn't in the current select — we'll join below
    // placeholder, filled from a separate query
    void r
  }

  // Get buyer requests with buyer_user_id
  const { data: buyerRequests } = await supabase
    .from('buyer_requests')
    .select('buyer_user_id, request_type, status')

  for (const r of buyerRequests || []) {
    if (!r.buyer_user_id) continue
    const existing = requestsByUserId.get(r.buyer_user_id) || { total: 0, property: 0, car: 0 }
    requestsByUserId.set(r.buyer_user_id, {
      total: existing.total + 1,
      property: existing.property + (r.request_type !== 'car' ? 1 : 0),
      car: existing.car + (r.request_type === 'car' ? 1 : 0),
    })
  }

  // Enrich brokers
  const enrichedBrokers = (brokers || []).map(b => {
    const purchases = purchasesByBroker.get(b.id) || { count: 0, creditsSpent: 0 }
    const creditsSpent = purchases.creditsSpent
    const creditsTotal = b.credits + creditsSpent
    // Estimated revenue: ~$20.000 ARS/credit average across packs
    const revenueEstimate = creditsTotal > 0 ? creditsTotal * 20000 : 0
    return {
      ...b,
      leads_unlocked: purchases.count,
      credits_spent: creditsSpent,
      credits_total: creditsTotal,
      revenue_estimate: revenueEstimate,
    }
  })

  // Enrich buyers
  const enrichedBuyers = (buyers || []).map(b => {
    const reqs = requestsByUserId.get(b.user_id) || { total: 0, property: 0, car: 0 }
    return { ...b, ...reqs }
  })

  // ── Aggregate stats ──────────────────────────────────────────
  const totalRequests = requests?.length ?? 0
  const activeRequests = requests?.filter(r => r.status === 'active').length ?? 0
  const totalBrokers = brokers?.length ?? 0
  const totalLeads = leadPurchases?.length ?? 0
  const totalBuyers = buyerCount ?? 0
  const totalCreditsSpent = (leadPurchases || []).reduce((s, p) => s + (p.credits_spent || 1), 0)
  const totalRevenueEstimate = Math.round(totalCreditsSpent * 4)

  const stats = [
    { icon: FileText, label: 'Publicaciones', value: totalRequests, sub: `${activeRequests} activas`, color: 'blue' },
    { icon: Users, label: 'Brokers', value: totalBrokers, sub: `${totalLeads} leads vendidos`, color: 'purple' },
    { icon: UserCheck, label: 'Compradores', value: totalBuyers, sub: 'cuentas registradas', color: 'green' },
    { icon: DollarSign, label: 'Revenue estimado', value: `~$${totalRevenueEstimate}`, sub: `${totalCreditsSpent} créditos vendidos`, color: 'orange' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">MatchProp · Gestión y métricas</p>
          </div>
          <a href="/pedidos" className="text-sm text-orange-500 hover:underline">
            ← Ver feed público
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{
                  backgroundColor:
                    color === 'blue' ? '#dbeafe' :
                    color === 'green' ? '#dcfce7' :
                    color === 'purple' ? '#f3e8ff' :
                    '#ffedd5',
                }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{
                    color:
                      color === 'blue' ? '#2563eb' :
                      color === 'green' ? '#16a34a' :
                      color === 'purple' ? '#9333ea' :
                      '#f97316',
                  }}
                />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs font-medium text-gray-600">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { id: 'requests', label: '📋 Publicaciones', count: totalRequests },
            { id: 'brokers', label: '🏠 Brokers', count: totalBrokers },
            { id: 'buyers', label: '🔍 Compradores', count: totalBuyers },
          ].map(t => (
            <a
              key={t.id}
              href={`/admin?key=${ADMIN_SECRET}&tab=${t.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {t.count}
              </span>
            </a>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'requests' && (
          <AdminTable requests={requests ?? []} adminSecret={ADMIN_SECRET} />
        )}
        {tab === 'brokers' && (
          <AdminUsersTable type="broker" users={enrichedBrokers} adminSecret={ADMIN_SECRET} />
        )}
        {tab === 'buyers' && (
          <AdminUsersTable type="buyer" users={enrichedBuyers} adminSecret={ADMIN_SECRET} />
        )}
      </div>
    </div>
  )
}
