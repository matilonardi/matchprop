'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, CreditCard, Unlock, TrendingUp, Plus, LogOut, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { PROPERTY_TYPE_LABELS } from '@/lib/constants'

interface Broker {
  id: string
  name: string
  agency_name?: string
  credits: number
  zones: string[]
  email: string
}

interface Lead {
  id: string
  request_id: string
  credits_spent: number
  purchased_at: string
  request: {
    property_types: string[]
    zones: string[]
    budget_usd: number
    contact_name: string
    contact_phone: string
    contact_email?: string
  } | null
}

export default function BrokerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [broker, setBroker] = useState<Broker | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/broker')
        return
      }

      const res = await fetch(`/api/broker/me?userId=${user.id}`)
      if (!res.ok) {
        router.replace('/broker')
        return
      }

      const data = await res.json()
      setBroker(data.broker)
      setLeads(data.leads || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/broker')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando tu dashboard...</p>
        </div>
      </div>
    )
  }

  if (!broker) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hola, {broker.name.split(' ')[0]} 👋
              </h1>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {broker.zones.slice(0, 3).join(', ')}{broker.zones.length > 3 ? ` +${broker.zones.length - 3}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-blue-900 text-xl">{broker.credits}</span>
                <span className="text-blue-600 text-sm">créditos</span>
              </div>
              <Link href="/broker/creditos">
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Comprar créditos
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Créditos disponibles', value: broker.credits, icon: <CreditCard className="h-5 w-5 text-blue-500" />, color: 'text-blue-600' },
              { label: 'Contactos desbloqueados', value: leads.length, icon: <Unlock className="h-5 w-5 text-green-500" />, color: 'text-green-600' },
              { label: 'Zonas activas', value: broker.zones.length, icon: <MapPin className="h-5 w-5 text-purple-500" />, color: 'text-purple-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  {icon}
                  <span className="text-sm text-gray-500">{label}</span>
                </div>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* New requests in zones */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  Pedidos en tus zonas
                </h2>
                <Link href="/pedidos" className="text-sm text-blue-600 hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="space-y-2">
                {broker.zones.map((zone) => (
                  <Link
                    key={zone}
                    href={`/pedidos?zone=${encodeURIComponent(zone)}`}
                    className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      {zone}
                    </div>
                    <span className="text-xs text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      Ver pedidos →
                    </span>
                  </Link>
                ))}
                <Link
                  href="/pedidos"
                  className="flex items-center justify-center gap-1.5 w-full mt-1 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Ver todos los pedidos activos
                </Link>
              </div>
            </div>

            {/* Unlocked leads */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-green-500" />
                  Contactos desbloqueados
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
                </span>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🔓</div>
                  <p className="text-sm text-gray-500 mb-3">Todavía no desbloqueaste ningún contacto.</p>
                  <Link href="/pedidos">
                    <Button size="sm" variant="outline" className="text-xs">
                      Ver pedidos activos
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {leads.map((lead) => {
                    const req = lead.request
                    if (!req) return null
                    const typeLabel = req.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t).join(' / ')
                    return (
                      <div key={lead.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{req.contact_name}</p>
                            <a href={`tel:${req.contact_phone}`} className="text-sm text-blue-600 hover:underline font-medium">
                              {req.contact_phone}
                            </a>
                            {req.contact_email && (
                              <p className="text-xs text-gray-400">{req.contact_email}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-gray-500">{typeLabel}</p>
                            <p className="text-xs text-gray-500">{req.zones[0]}</p>
                            <p className="text-xs font-medium text-gray-700">USD {req.budget_usd.toLocaleString()}</p>
                          </div>
                        </div>
                        <a
                          href={`https://wa.me/${req.contact_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 hover:underline font-medium"
                        >
                          💬 Contactar por WhatsApp
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Market insights */}
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-semibold">Inteligencia de mercado</h3>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Próximamente</span>
            </div>
            <p className="text-blue-100/80 text-sm">
              Pronto vas a ver qué zonas tienen más demanda, tickets promedio por barrio,
              y qué requisitos están siendo más pedidos esta semana.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
