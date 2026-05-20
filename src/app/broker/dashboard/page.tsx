import Link from 'next/link'
import { Bell, CreditCard, Eye, Unlock, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'

// In production this would be authenticated and fetch real broker data
export default function BrokerDashboard() {
  const mockStats = {
    credits: 12,
    leads_unlocked: 7,
    requests_seen: 43,
    zones: ['Mendiolaza', 'Valle Escondido', 'Villa Allende'],
  }

  const mockLeads = [
    {
      id: '1',
      type: 'Casa',
      zone: 'Mendiolaza',
      budget: 230000,
      unlocked_at: '2025-05-18',
      contact_name: 'Jorge Pérez',
      contact_phone: '+54 9 351 123 4567',
    },
    {
      id: '2',
      type: 'Casa',
      zone: 'Valle Escondido',
      budget: 620000,
      unlocked_at: '2025-05-17',
      contact_name: 'Ana Martínez',
      contact_phone: '+54 9 351 765 4321',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">
                Zonas: {mockStats.zones.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">{mockStats.credits}</span>
                <span className="text-blue-600 text-sm">créditos</span>
              </div>
              <Link href="/broker/creditos">
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Comprar créditos
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Créditos disponibles', value: mockStats.credits, icon: <CreditCard className="h-5 w-5 text-blue-500" /> },
              { label: 'Leads desbloqueados', value: mockStats.leads_unlocked, icon: <Unlock className="h-5 w-5 text-green-500" /> },
              { label: 'Pedidos vistos', value: mockStats.requests_seen, icon: <Eye className="h-5 w-5 text-purple-500" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  {icon}
                  <span className="text-sm text-gray-500">{label}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* New requests in your zones */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  Nuevos en tus zonas
                </h2>
                <Link href="/pedidos" className="text-sm text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { type: 'Casa', zone: 'Mendiolaza', budget: 230000, ago: '2h' },
                  { type: 'Casa', zone: 'Valle Escondido', budget: 620000, ago: '4h' },
                  { type: 'Dúplex', zone: 'Villa Allende', budget: 180000, ago: '1d' },
                ].map(({ type, zone, budget, ago }) => (
                  <div
                    key={`${type}-${zone}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {type} · {zone}
                      </p>
                      <p className="text-xs text-gray-500">
                        USD {budget.toLocaleString()} · hace {ago}
                      </p>
                    </div>
                    <Link href="/pedidos">
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Ver
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Unlocked leads */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-green-500" />
                  Contactos desbloqueados
                </h2>
                <span className="text-xs text-gray-400">{mockLeads.length} leads</span>
              </div>
              <div className="space-y-3">
                {mockLeads.map((lead) => (
                  <div key={lead.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.contact_name}</p>
                        <a
                          href={`tel:${lead.contact_phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {lead.contact_phone}
                        </a>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{lead.type} · {lead.zone}</p>
                        <p className="text-xs font-medium text-gray-700">
                          USD {lead.budget.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${lead.contact_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-xs text-green-600 hover:underline"
                    >
                      Contactar por WhatsApp →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market insights teaser */}
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-semibold">Inteligencia de mercado</h3>
              <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">Próximamente</span>
            </div>
            <p className="text-blue-100 text-sm">
              Pronto vas a ver qué zonas tienen más demanda, tickets promedio por barrio,
              y qué requisitos están siendo más pedidos esta semana.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
