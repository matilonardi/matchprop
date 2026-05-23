import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Users, FileText, ShoppingCart, BarChart3 } from 'lucide-react'
import AdminTable from './AdminTable'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams

  // Guard: require ADMIN_SECRET query param
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  if (params.key !== ADMIN_SECRET) {
    redirect('/?error=unauthorized')
  }

  const supabase = createServerClient()

  const [
    { data: requests },
    { data: brokers },
    { count: leadCount },
  ] = await Promise.all([
    supabase
      .from('buyer_requests')
      .select(
        'id, request_type, contact_name, contact_email, contact_phone, zones, budget_usd, is_active, views_count, created_at'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('broker_profiles')
      .select('id', { count: 'exact' }),
    supabase
      .from('lead_purchases')
      .select('id', { count: 'exact', head: true }),
  ])

  const totalRequests = requests?.length ?? 0
  const activeRequests = requests?.filter((r) => r.is_active !== false).length ?? 0
  const totalBrokers = brokers?.length ?? 0
  const totalLeads = leadCount ?? 0

  const stats = [
    { icon: FileText, label: 'Total pedidos', value: totalRequests, color: 'blue' },
    { icon: BarChart3, label: 'Pedidos activos', value: activeRequests, color: 'green' },
    { icon: Users, label: 'Brokers registrados', value: totalBrokers, color: 'purple' },
    { icon: ShoppingCart, label: 'Leads vendidos', value: totalLeads, color: 'orange' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">MatchProp · Gestión de pedidos</p>
          </div>
          <a href="/pedidos" className="text-sm text-orange-500 hover:underline">
            ← Ver feed público
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2`}
                style={{
                  backgroundColor:
                    color === 'blue'
                      ? '#dbeafe'
                      : color === 'green'
                      ? '#dcfce7'
                      : color === 'purple'
                      ? '#f3e8ff'
                      : '#ffedd5',
                }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{
                    color:
                      color === 'blue'
                        ? '#2563eb'
                        : color === 'green'
                        ? '#16a34a'
                        : color === 'purple'
                        ? '#9333ea'
                        : '#f97316',
                  }}
                />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Requests table — client component for delete */}
        <AdminTable
          requests={requests ?? []}
          adminSecret={ADMIN_SECRET}
        />
      </div>
    </div>
  )
}
