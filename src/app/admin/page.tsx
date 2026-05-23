import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Users, FileText, Eye, TrendingUp } from 'lucide-react'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams
  if (params.key !== ADMIN_SECRET) {
    redirect('/?error=unauthorized')
  }

  const supabase = createServerClient()

  const [{ data: brokers }, { data: requests }] = await Promise.all([
    supabase
      .from('broker_profiles')
      .select('id, name, agency_name, email, phone, zones, credits, subscription, verified, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('buyer_requests')
      .select('id, property_types, zones, budget_usd, financing, status, views_count, leads_count, created_at, contact_name')
      .order('created_at', { ascending: false }),
  ])

  const totalViews = requests?.reduce((s, r) => s + (r.views_count || 0), 0) ?? 0
  const totalLeads = requests?.reduce((s, r) => s + (r.leads_count || 0), 0) ?? 0

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor(diff / 3600000)
    if (days > 0) return `hace ${days}d`
    if (hours > 0) return `hace ${hours}h`
    return 'recién'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">MatchProp · Córdoba</p>
          </div>
          <a href="/pedidos" className="text-sm text-blue-600 hover:underline">← Ver feed público</a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Inmobiliarias', value: brokers?.length ?? 0, color: 'blue' },
            { icon: FileText, label: 'Pedidos activos', value: requests?.filter(r => r.status === 'active').length ?? 0, color: 'green' },
            { icon: Eye, label: 'Vistas totales', value: totalViews, color: 'purple' },
            { icon: TrendingUp, label: 'Leads desbloqueados', value: totalLeads, color: 'orange' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 text-${color}-600`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Brokers */}
        <div className="bg-white rounded-xl border border-gray-100 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Inmobiliarias registradas ({brokers?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase bg-gray-50">
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Teléfono</th>
                  <th className="text-left px-4 py-3">Zonas</th>
                  <th className="text-left px-4 py-3">Créditos</th>
                  <th className="text-left px-4 py-3">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {brokers?.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {b.name}
                      {b.agency_name && <span className="block text-xs text-gray-400">{b.agency_name}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.email}</td>
                    <td className="px-4 py-3 text-gray-600">{b.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.zones?.slice(0, 3).join(', ')}{(b.zones?.length ?? 0) > 3 ? ` +${b.zones.length - 3}` : ''}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{b.credits} créditos</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{timeAgo(b.created_at)}</td>
                  </tr>
                ))}
                {!brokers?.length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin inmobiliarias registradas todavía</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requests */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Búsquedas publicadas ({requests?.length ?? 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase bg-gray-50">
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Zona</th>
                  <th className="text-left px-4 py-3">Presupuesto</th>
                  <th className="text-left px-4 py-3">Pago</th>
                  <th className="text-left px-4 py-3">Vistas</th>
                  <th className="text-left px-4 py-3">Contacto</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests?.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{r.property_types?.join(', ')}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.zones?.slice(0, 2).join(', ')}{(r.zones?.length ?? 0) > 2 ? ` +${r.zones.length - 2}` : ''}</td>
                    <td className="px-4 py-3 font-medium">{r.budget_usd === 999999 ? 'Sin límite' : `USD ${r.budget_usd?.toLocaleString()}`}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{r.financing}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{r.views_count}</span>
                      {r.leads_count > 0 && <span className="ml-2 text-green-600 text-xs">+{r.leads_count} leads</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.contact_name?.replace('Consultar por MP', '—')}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{timeAgo(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
