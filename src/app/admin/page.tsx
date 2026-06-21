import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  Users, FileText,
  DollarSign, UserCheck,
} from 'lucide-react'
import AdminTable from './AdminTable'
import AdminUsersTable from './AdminUsersTable'
import { adminLogout } from './login/actions'
import ChartPublicaciones from './ChartPublicaciones'
import AdminExportButton from './AdminExportButton'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams

  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  const cookieStore = await cookies()
  const session = cookieStore.get('matchprop_admin')?.value
  if (session !== ADMIN_SECRET) {
    redirect('/admin/login')
  }

  const tab = params.tab || 'pulso'
  const supabase = createServerClient()

  const weekAgo  = new Date(Date.now() - 7  * 24 * 3600 * 1000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  const [
    { data: requests },
    { data: brokers },
    { data: buyers },
    { data: leadPurchases },
    { data: creditTxns },
    { count: buyerCount },
    { count: pedidosWeek },
    { count: pedidosMonth },
    { count: leadsWeek },
    { count: brokersWeek },
  ] = await Promise.all([
    supabase
      .from('buyer_requests')
      .select('id, request_type, publisher_type, agency_name, contact_name, contact_email, contact_phone, zones, budget_usd, status, views_count, created_at')
      .order('created_at', { ascending: false }),

    supabase
      .from('broker_profiles')
      .select('id, name, agency_name, email, phone, zones, credits, created_at'),

    supabase
      .from('buyer_profiles')
      .select('id, user_id, name, phone, created_at'),

    supabase
      .from('lead_purchases')
      .select('id, broker_id, credits_spent, purchased_at'),

    // Compras de créditos vía MercadoPago
    supabase
      .from('credit_transactions')
      .select('id, broker_id, amount, description, mp_payment_id, created_at')
      .gt('amount', 0)
      .order('created_at', { ascending: false }),

    supabase
      .from('buyer_profiles')
      .select('id', { count: 'exact', head: true }),

    // Pedidos esta semana
    supabase
      .from('buyer_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo),

    // Pedidos este mes
    supabase
      .from('buyer_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthAgo),

    // Desbloqueos esta semana
    supabase
      .from('lead_purchases')
      .select('id', { count: 'exact', head: true })
      .gte('purchased_at', weekAgo),

    // Brokers nuevos esta semana
    supabase
      .from('broker_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo),
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

  // Aggregate pedidos loaded per agency (by agency_name match)
  const pedidosByAgency = new Map<string, number>()
  for (const r of requests || []) {
    if (r.agency_name) {
      pedidosByAgency.set(r.agency_name, (pedidosByAgency.get(r.agency_name) || 0) + 1)
    }
  }

  // Enrich brokers
  const enrichedBrokers = (brokers || []).map(b => {
    const purchases = purchasesByBroker.get(b.id) || { count: 0, creditsSpent: 0 }
    const creditsSpent = purchases.creditsSpent
    const creditsTotal = b.credits + creditsSpent
    const revenueEstimate = creditsTotal > 0 ? creditsTotal * 20000 : 0
    const pedidosLoaded = b.agency_name ? (pedidosByAgency.get(b.agency_name) || 0) : 0
    return {
      ...b,
      leads_unlocked: purchases.count,
      pedidos_loaded: pedidosLoaded,
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

  // ── Revenue real desde credit_transactions ──────────────────
  const PACK_PRICES: Record<number, number> = { 3: 80000, 5: 100000, 10: 180000, 999: 350000 }
  const txns = creditTxns || []
  const totalCreditsBought = txns.reduce((s, t) => s + (t.amount === 999 ? 999 : t.amount), 0)
  const totalRevenueARS    = txns.reduce((s, t) => s + (PACK_PRICES[t.amount] ?? 0), 0)
  const txnsThisWeek       = txns.filter(t => t.created_at >= weekAgo)
  const revenueThisWeek    = txnsThisWeek.reduce((s, t) => s + (PACK_PRICES[t.amount] ?? 0), 0)

  // ── Aggregate stats ──────────────────────────────────────────
  const totalRequests = requests?.length ?? 0
  const activeRequests = requests?.filter(r => r.status === 'active').length ?? 0
  const inmoRequests = requests?.filter(r => r.publisher_type === 'inmobiliaria').length ?? 0
  const particularRequests = totalRequests - inmoRequests
  const totalBrokers = brokers?.length ?? 0
  const totalLeads = leadPurchases?.length ?? 0
  const totalBuyers = buyerCount ?? 0
  const totalCreditsSpent = (leadPurchases || []).reduce((s, p) => s + (p.credits_spent || 1), 0)

  // ── Top zonas para el filtro del gráfico ─────────────────────
  const zoneCounts: Record<string, number> = {}
  for (const r of requests || []) {
    for (const z of r.zones || []) {
      zoneCounts[z] = (zoneCounts[z] || 0) + 1
    }
  }
  const topZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([z]) => z)
    .sort((a, b) => a.localeCompare(b, 'es'))

  // ── Pulso metrics ─────────────────────────────────────────────
  const totalViews = (requests || []).reduce((s, r) => s + (r.views_count || 0), 0)
  const pedidosConVistas = (requests || []).filter(r => (r.views_count || 0) > 0).length
  const conversionRate = totalRequests > 0 ? Math.round((pedidosConVistas / totalRequests) * 100) : 0
  const pulsoScore = Math.min(100, Math.round(
    ((pedidosWeek ?? 0) * 3) +
    ((leadsWeek ?? 0) * 10) +
    ((brokersWeek ?? 0) * 5) +
    (totalViews > 0 ? 10 : 0)
  ))
  const pulsoLabel = pulsoScore >= 60 ? '🔥 Caliente' : pulsoScore >= 25 ? '🌤️ Tibio' : '❄️ Frío'
  const pulsoColor = pulsoScore >= 60 ? 'text-red-600 bg-red-50 border-red-200' : pulsoScore >= 25 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-blue-600 bg-blue-50 border-blue-200'

  const fmtARS = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`

  const stats = [
    { icon: FileText,   label: 'Publicaciones', value: totalRequests,   sub: `${inmoRequests} inmo · ${particularRequests} particulares`, color: 'blue'   },
    { icon: Users,      label: 'Inmos (brokers)',value: totalBrokers,   sub: `${totalLeads} contactos desbloqueados`,                     color: 'purple' },
    { icon: UserCheck,  label: 'Particulares',   value: totalBuyers,    sub: 'compradores registrados',                                   color: 'green'  },
    { icon: DollarSign, label: 'Revenue',        value: totalRevenueARS > 0 ? fmtARS(totalRevenueARS) : '$0', sub: `${txns.length} compras · ${totalCreditsBought} créditos`, color: 'orange' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">Demandi · Gestión y métricas</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/pedidos" className="text-sm text-orange-500 hover:underline">
              ← Ver feed público
            </a>
            <form action={adminLogout}>
              <button type="submit" className="text-sm text-gray-400 hover:text-gray-600">
                Cerrar sesión
              </button>
            </form>
          </div>
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
            { id: 'pulso', label: '📡 Pulso', count: null },
            { id: 'requests', label: '📋 Publicaciones', count: totalRequests },
            { id: 'brokers', label: '🏠 Brokers', count: totalBrokers },
            { id: 'buyers', label: '🔍 Compradores', count: totalBuyers },
          ].map(t => (
            <a
              key={t.id}
              href={`/admin?tab=${t.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.count !== null && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {t.count}
              </span>}
            </a>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'pulso' && (
          <div className="space-y-6">
            {/* Temperatura general */}
            <div className={`rounded-2xl border p-6 flex items-center gap-6 ${pulsoColor}`}>
              <div className="text-5xl font-black">{pulsoScore}</div>
              <div>
                <div className="text-xl font-bold">{pulsoLabel}</div>
                <div className="text-sm opacity-80 mt-0.5">Índice de actividad de la plataforma esta semana</div>
              </div>
              <div className="ml-auto text-right text-sm opacity-70">
                <div>Pedidos + vistas + desbloqueos + brokers nuevos</div>
              </div>
            </div>

            {/* Gráfico publicaciones por día */}
            <ChartPublicaciones topZones={topZones} />

            {/* KPIs esta semana */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Esta semana</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Pedidos nuevos', value: pedidosWeek ?? 0, sub: `${pedidosMonth ?? 0} este mes`, emoji: '📥', good: (pedidosWeek ?? 0) > 0 },
                  { label: 'Contactos desbloqueados', value: leadsWeek ?? 0, sub: `${totalLeads} total`, emoji: '🔓', good: (leadsWeek ?? 0) > 0 },
                  { label: 'Brokers nuevos', value: brokersWeek ?? 0, sub: `${totalBrokers} registrados`, emoji: '🏢', good: (brokersWeek ?? 0) > 0 },
                  { label: 'Vistas del feed', value: totalViews, sub: `${conversionRate}% con vistas`, emoji: '👁️', good: totalViews > 0 },
                ].map(k => (
                  <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{k.emoji}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.good ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {k.good ? '● activo' : '○ sin datos'}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{k.value}</div>
                    <div className="text-xs font-medium text-gray-600 mt-0.5">{k.label}</div>
                    <div className="text-xs text-gray-400">{k.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs acumulados */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Acumulado total</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Pedidos activos',      value: activeRequests,                                            sub: `${totalRequests} total`,                   emoji: '📋' },
                  { label: 'Brokers registrados',  value: totalBrokers,                                              sub: 'en la plataforma',                         emoji: '🏢' },
                  { label: 'Desbloqueos totales',  value: totalLeads,                                                sub: `${totalCreditsSpent} créditos gastados`,    emoji: '🔓' },
                  { label: 'Revenue total',        value: totalRevenueARS > 0 ? fmtARS(totalRevenueARS) : '$0',    sub: `${txns.length} compras realizadas`,          emoji: '💰' },
                ].map(k => (
                  <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="text-2xl mb-2">{k.emoji}</div>
                    <div className="text-3xl font-bold text-gray-900">{k.value}</div>
                    <div className="text-xs font-medium text-gray-600 mt-0.5">{k.label}</div>
                    <div className="text-xs text-gray-400">{k.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historial de compras de créditos */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Compras de créditos</h2>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {txns.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Aún no hay compras registradas.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Broker</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pack</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Créditos</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Monto ARS</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {txns.map(t => {
                        const broker = (brokers || []).find(b => b.id === t.broker_id)
                        const ars = PACK_PRICES[t.amount] ?? 0
                        return (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-700">{broker?.name || broker?.agency_name || '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{t.description?.split('—')[0]?.replace('Compra: ','').trim() || '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-orange-500">{t.amount === 999 ? '∞' : t.amount}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{ars > 0 ? `$${ars.toLocaleString('es-AR')}` : '—'}</td>
                            <td className="px-4 py-3 text-right text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString('es-AR')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-500">Total</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{totalRevenueARS > 0 ? `$${totalRevenueARS.toLocaleString('es-AR')}` : '$0'}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Top pedidos con más vistas */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pedidos más vistos</h2>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pedido</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Zona</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Vistas</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Publicado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(requests || [])
                      .filter(r => (r.views_count || 0) > 0)
                      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                      .slice(0, 8)
                      .map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <a href={`/pedidos/${r.id}`} target="_blank" className="text-orange-600 hover:underline font-medium">
                              {r.contact_name || 'Sin nombre'}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{(r.zones || []).slice(0,2).join(', ')}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{r.views_count}</td>
                          <td className="px-4 py-3 text-right text-gray-400 text-xs">
                            {new Date(r.created_at).toLocaleDateString('es-AR')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {tab === 'requests' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Exportar pedidos</p>
              <AdminExportButton />
            </div>
            <AdminTable requests={requests ?? []} adminSecret={ADMIN_SECRET} />
          </div>
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
