'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, CreditCard, Unlock, TrendingUp, Plus, LogOut, Loader2,
  MapPin, MessageCircle, FileSearch, Search, Flame, Zap,
  BarChart2, Target, ChevronRight, AlertCircle, ClipboardList, Building2,
  CheckCircle2, X, Pencil,
} from 'lucide-react'
import { buildZonaPropUrl } from '@/lib/zonaprop'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { PROPERTY_TYPE_LABELS, ZONES_CORDOBA } from '@/lib/constants'

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
  total_messages: number
  unread_count: number
  request: {
    property_types: string[]
    zones: string[]
    budget_usd: number
    contact_name: string
    contact_phone: string
    contact_email?: string
    bedrooms_min?: number | null
    bedrooms_max?: number | null
    description?: string | null
  } | null
}

interface ZoneStat {
  zone: string
  count: number
  avgBudget: number
}

interface BrokerPedido {
  id: string
  property_types: string[]
  zones: string[]
  budget_usd: number
  contact_name: string
  contact_phone: string
  bedrooms_min: number | null
  bedrooms_max: number | null
  description: string | null
  urgency: string | null
  operation_type: string | null
  status: string
  created_at: string
}

interface MarketStats {
  zoneStats: ZoneStat[]
  typeBreakdown: Record<string, number>
  newThisWeek: number
  avgBudget: number
  totalActive: number
  unlockedOpportunities: { zone: string; count: number }[]
  totalUnlocked: number
}

// Color por intensidad (posición en el ranking)
function heatColor(rank: number, total: number): string {
  const pct = 1 - rank / total
  if (pct > 0.75) return 'bg-red-500'
  if (pct > 0.5)  return 'bg-orange-500'
  if (pct > 0.25) return 'bg-orange-300'
  return 'bg-blue-300'
}

export default function BrokerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [broker, setBroker] = useState<Broker | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [platformStats, setPlatformStats] = useState<{ total: number; byUs: number } | null>(null)
  const [misPedidos, setMisPedidos] = useState<BrokerPedido[]>([])
  const [editingPedido, setEditingPedido] = useState<BrokerPedido | null>(null)
  const [editForm, setEditForm] = useState({ zones: [] as string[], budget_usd: '', bedrooms_min: '', bedrooms_max: '', description: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [zoneSearch, setZoneSearch] = useState('')
  const [closeTarget, setCloseTarget] = useState<{ id: string; name: string } | null>(null)
  const [closeReason, setCloseReason] = useState('')
  const [closeSubmitting, setCloseSubmitting] = useState(false)

  // Survey state
  interface PendingSurvey {
    lead_id: string
    purchased_at: string
    request: { property_types: string[]; zones: string[]; budget_usd: number; contact_name: string } | null
  }
  const [pendingSurveys, setPendingSurveys] = useState<PendingSurvey[]>([])
  const [surveyOutcome, setSurveyOutcome] = useState('')
  const [surveySubmitting, setSurveySubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/broker?login=1')
          return
        }

        const res = await fetch(`/api/broker/me?userId=${user.id}`)
        if (!res.ok) {
          setLoadError('No encontramos un perfil de broker para esta cuenta. Si acabás de registrarte, esperá unos segundos y recargá la página.')
          return
        }

        const data = await res.json()
        setBroker(data.broker)
        setLeads(data.leads || [])

        // Broker's own pedidos
        fetch(`/api/broker/pedidos?userId=${user.id}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => d?.pedidos && setMisPedidos(d.pedidos))
          .catch(() => {})

        // Market stats (fire after broker loads)
        const zonesParam = encodeURIComponent((data.broker.zones as string[]).join(','))
        fetch(`/api/broker/market-stats?broker_id=${data.broker.id}&zones=${zonesParam}`)
          .then(r => r.json())
          .then(setMarketStats)
          .catch(() => {})

        // Pending surveys (10+ days old unlocks without outcome)
        fetch(`/api/broker/pending-surveys?broker_id=${data.broker.id}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => d?.surveys?.length && setPendingSurveys(d.surveys))
          .catch(() => {})

        // Platform stats — total active pedidos + pedidos loaded by us
        Promise.all([
          supabase.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('buyer_requests').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('publisher_type', 'inmobiliaria'),
        ]).then(([{ count: total }, { count: byUs }]) => {
          setPlatformStats({ total: total ?? 0, byUs: byUs ?? 0 })
        }).catch(() => {})
      } catch {
        setLoadError('Error al cargar el dashboard. Por favor recargá la página.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  function openEditModal(p: BrokerPedido) {
    setEditingPedido(p)
    setEditForm({
      zones: p.zones || [],
      budget_usd: String(p.budget_usd || ''),
      bedrooms_min: p.bedrooms_min != null ? String(p.bedrooms_min) : '',
      bedrooms_max: p.bedrooms_max != null ? String(p.bedrooms_max) : '',
      description: p.description || '',
    })
    setEditError('')
    setZoneSearch('')
  }

  async function saveEdit() {
    if (!editingPedido) return
    if (editForm.zones.length === 0) { setEditError('Seleccioná al menos una zona.'); return }
    if (!editForm.budget_usd) { setEditError('Ingresá el presupuesto.'); return }
    setEditSaving(true)
    setEditError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch(`/api/broker/pedidos/${editingPedido.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          zones: editForm.zones,
          budget_usd: Number(editForm.budget_usd),
          bedrooms_min: editForm.bedrooms_min ? Number(editForm.bedrooms_min) : null,
          bedrooms_max: editForm.bedrooms_max ? Number(editForm.bedrooms_max) : null,
          description: editForm.description || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setEditError(json.error || 'Error al guardar')
        return
      }
      setMisPedidos(prev => prev.map(p => p.id === editingPedido.id ? {
        ...p,
        zones: editForm.zones,
        budget_usd: Number(editForm.budget_usd),
        bedrooms_min: editForm.bedrooms_min ? Number(editForm.bedrooms_min) : null,
        bedrooms_max: editForm.bedrooms_max ? Number(editForm.bedrooms_max) : null,
        description: editForm.description || null,
      } : p))
      setEditingPedido(null)
    } catch {
      setEditError('Error de conexión')
    } finally {
      setEditSaving(false)
    }
  }

  function openCloseModal(p: BrokerPedido) {
    setCloseTarget({ id: p.id, name: p.contact_name })
    setCloseReason('')
  }

  async function confirmClose() {
    if (!closeTarget || !closeReason) return
    setCloseSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch(`/api/broker/pedidos/${closeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'close' }),
      })
      if (res.ok) {
        setMisPedidos(prev => prev.map(p => p.id === closeTarget.id ? { ...p, status: 'closed' } : p))
        setCloseTarget(null)
      }
    } finally {
      setCloseSubmitting(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/broker')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {loadError ? (
          <div className="max-w-md text-center px-6">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-700 font-medium mb-2">No se pudo cargar el dashboard</p>
            <p className="text-sm text-gray-500 mb-6">{loadError}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg">
                Reintentar
              </button>
              <a href="/broker?login=1" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                Volver al login
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Cargando tu dashboard...</p>
          </div>
        )}
      </div>
    )
  }

  if (!broker) return null

  const totalUnread = leads.reduce((sum, l) => sum + (l.unread_count || 0), 0)
  const maxZoneCount = marketStats?.zoneStats[0]?.count ?? 1

  // Top property type
  const topType = marketStats
    ? Object.entries(marketStats.typeBreakdown).sort((a, b) => b[1] - a[1])[0]
    : null

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
                <CreditCard className="h-4 w-4 text-orange-500" />
                <span className="font-bold text-blue-900 text-xl">{broker.credits}</span>
                <span className="text-orange-500 text-sm">créditos</span>
              </div>
              <Link href="/broker/creditos">
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Comprar créditos
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-3">
            {[
              { label: 'Créditos disponibles', value: broker.credits, icon: <CreditCard className="h-5 w-5 text-blue-500" />, color: 'text-orange-500', badge: null },
              { label: 'Contactos desbloqueados', value: leads.length, icon: <Unlock className="h-5 w-5 text-green-500" />, color: 'text-green-600', badge: totalUnread > 0 ? totalUnread : null },
              { label: 'Zonas activas', value: broker.zones.length, icon: <MapPin className="h-5 w-5 text-purple-500" />, color: 'text-purple-600', badge: null },
            ].map(({ label, value, icon, color, badge }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-2">
                  {icon}
                  <span className="text-sm text-gray-500">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  {badge !== null && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                      <MessageCircle className="h-3 w-3" />
                      {badge} nuevo{badge !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Platform stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                <span className="text-sm text-gray-500">Pedidos en plataforma</span>
              </div>
              <p className="text-3xl font-bold text-indigo-600">{platformStats?.total ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-5 w-5 text-teal-500" />
                <span className="text-sm text-gray-500">Mis búsquedas cargadas</span>
              </div>
              <p className="text-3xl font-bold text-teal-600">{misPedidos.length || '—'}</p>
              <p className="text-xs text-gray-400 mt-1">
                {misPedidos.filter(p => p.status === 'active').length} activas
              </p>
            </div>
          </div>

          {/* Personal activity grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* New requests in zones */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  Pedidos en tus zonas
                </h2>
                <Link href="/pedidos" className="text-sm text-orange-500 hover:underline">
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
                    <span className="text-xs text-orange-500 group-hover:translate-x-0.5 transition-transform">
                      Ver búsquedas →
                    </span>
                  </Link>
                ))}
                <Link
                  href="/pedidos"
                  className="flex items-center justify-center gap-1.5 w-full mt-1 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Ver todas las búsquedas activas
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
                      Ver búsquedas activas
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
                            <a href={`tel:${req.contact_phone}`} className="text-sm text-orange-500 hover:underline font-medium">
                              {req.contact_phone}
                            </a>
                            {req.contact_email && (
                              <p className="text-xs text-gray-400">{req.contact_email}</p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0">
                            USD {req.budget_usd.toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-2 p-2 bg-white border border-gray-100 rounded-lg space-y-1">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">{typeLabel}</span>
                            {(req.bedrooms_min || req.bedrooms_max) && (
                              <span className="ml-1 text-gray-400">
                                · {req.bedrooms_min === req.bedrooms_max
                                  ? `${req.bedrooms_min} dorm.`
                                  : req.bedrooms_min && req.bedrooms_max
                                    ? `${req.bedrooms_min}–${req.bedrooms_max} dorm.`
                                    : req.bedrooms_min ? `+${req.bedrooms_min} dorm.` : `hasta ${req.bedrooms_max} dorm.`}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                            {req.zones.join(', ')}
                          </p>
                          {req.description && (
                            <p className="text-xs text-gray-400 italic line-clamp-2">
                              "{req.description}"
                            </p>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <a
                            href={`https://wa.me/${req.contact_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline font-medium"
                          >
                            💬 WhatsApp
                          </a>
                          <Link
                            href={`/pedidos/${lead.request_id}`}
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:underline font-medium"
                          >
                            <FileSearch className="h-3 w-3" />
                            Ver búsqueda
                          </Link>
                          <a
                            href={buildZonaPropUrl({
                              property_types: req.property_types,
                              zones: req.zones,
                              budget_usd: req.budget_usd,
                              bedrooms_min: req.bedrooms_min,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                          >
                            <Search className="h-3 w-3" />
                            ZonaProp
                          </a>
                          <Link
                            href={`/pedidos/${lead.request_id}#mensajes`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {lead.total_messages > 0 ? 'Ver chat' : 'Iniciar chat'}
                            {lead.unread_count > 0 && (
                              <span className="inline-flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 leading-none">
                                {lead.unread_count}
                              </span>
                            )}
                          </Link>
                        </div>

                        {lead.unread_count > 0 ? (
                          <p className="mt-1 text-[11px] text-orange-600 font-medium">
                            ● {lead.unread_count === 1 ? 'Tenés 1 respuesta nueva' : `Tenés ${lead.unread_count} respuestas nuevas`}
                          </p>
                        ) : lead.total_messages > 0 ? (
                          <p className="mt-1 text-[11px] text-gray-400">
                            {lead.total_messages} {lead.total_messages === 1 ? 'mensaje enviado' : 'mensajes'} · Sin respuesta pendiente
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── MIS BÚSQUEDAS ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-500" />
                Mis búsquedas
                {misPedidos.length > 0 && (
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {misPedidos.length}
                  </span>
                )}
              </h2>
              <Link href="/publicar">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-xs h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Nueva búsqueda
                </Button>
              </Link>
            </div>

            {misPedidos.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-gray-400 text-sm mb-3">Todavía no cargaste ninguna búsqueda de clientes.</p>
                <Link href="/publicar">
                  <Button size="sm" variant="outline" className="text-xs">Cargar primera búsqueda</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {misPedidos.map((p) => {
                  const typeLabel = (p.property_types || []).map((t: string) => PROPERTY_TYPE_LABELS[t] || t).join(' / ')
                  const isActive = p.status === 'active'
                  return (
                    <div key={p.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">{p.contact_name}</span>
                          <a href={`tel:${p.contact_phone}`} className="text-xs text-orange-500 hover:underline">
                            {p.contact_phone}
                          </a>
                          {isActive ? (
                            <span className="text-[11px] font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">activa</span>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">finalizada</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {typeLabel}
                          {p.bedrooms_min && ` · ${p.bedrooms_min}${p.bedrooms_max ? `–${p.bedrooms_max}` : '+'} dorm.`}
                          {' · '}<span className="font-medium">USD {(p.budget_usd || 0).toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {(p.zones || []).slice(0, 3).join(', ')}{(p.zones || []).length > 3 ? ` +${p.zones.length - 3}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <Link
                          href={`/pedidos/${p.id}`}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-lg px-2.5 py-1.5 transition-colors"
                        >
                          <FileSearch className="h-3.5 w-3.5" />
                          Ver
                        </Link>
                        {isActive && (
                          <>
                            <button
                              onClick={() => openEditModal(p)}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              onClick={() => openCloseModal(p)}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Finalizar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── MARKET INTELLIGENCE ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-white" />
                <h3 className="font-bold text-white text-lg">Inteligencia de mercado</h3>
              </div>
              {marketStats && (
                <span className="text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-full">
                  {marketStats.totalActive} búsquedas activas en Córdoba
                </span>
              )}
            </div>

            <div className="bg-white p-6 space-y-6">

              {/* Market summary stats */}
              {marketStats ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-medium text-orange-700">Nuevos esta semana</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{marketStats.newThisWeek}</p>
                    <p className="text-xs text-orange-500 mt-0.5">pedidos publicados</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart2 className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700">Ticket promedio</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">
                      {marketStats.avgBudget > 0 ? `${Math.round(marketStats.avgBudget / 1000)}k` : '—'}
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">USD en el mercado</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-700">Más buscado</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-700 capitalize">
                      {topType ? (PROPERTY_TYPE_LABELS[topType[0]] || topType[0]) : '—'}
                    </p>
                    <p className="text-xs text-purple-500 mt-0.5">
                      {topType ? `${topType[1]} búsquedas activas` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 h-24 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Two-column: Opportunities + Zone heatmap */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Opportunities FOMO panel */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-white" />
                    <span className="font-semibold text-white text-sm">Oportunidades en tus zonas</span>
                  </div>

                  {!marketStats ? (
                    <div className="p-4 space-y-2">
                      {[0, 1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                    </div>
                  ) : marketStats.totalUnlocked === 0 ? (
                    <div className="p-6 text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <p className="text-sm font-medium text-gray-700">¡Tenés todo al día!</p>
                      <p className="text-xs text-gray-400 mt-1">Desbloqueaste todos los pedidos en tus zonas.</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      {/* Big FOMO number */}
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-center">
                        <p className="text-4xl font-black text-orange-600">{marketStats.totalUnlocked}</p>
                        <p className="text-sm text-orange-700 font-medium mt-0.5">
                          {marketStats.totalUnlocked === 1
                            ? 'pedido sin desbloquear en tus zonas'
                            : 'pedidos sin desbloquear en tus zonas'}
                        </p>
                      </div>

                      {/* Per-zone breakdown */}
                      <div className="space-y-2">
                        {marketStats.unlockedOpportunities.slice(0, 5).map(({ zone, count }) => (
                          <Link
                            key={zone}
                            href={`/pedidos?zone=${encodeURIComponent(zone)}`}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-orange-400" />
                              <span className="text-sm font-medium text-gray-700">{zone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">
                                {count} {count === 1 ? 'pedido' : 'pedidos'}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>

                      <Link href="/pedidos">
                        <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-sm">
                          Ver todas las oportunidades →
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Zone heatmap */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-gray-800 text-sm">Zonas con más demanda</span>
                  </div>

                  {!marketStats ? (
                    <div className="p-4 space-y-2">
                      {[0,1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {marketStats.zoneStats.slice(0, 8).map((z, i) => {
                        const widthPct = Math.max(8, Math.round((z.count / maxZoneCount) * 100))
                        const color = heatColor(i, marketStats.zoneStats.length)
                        return (
                          <Link
                            key={z.zone}
                            href={`/pedidos?zone=${encodeURIComponent(z.zone)}`}
                            className="flex items-center gap-3 group"
                          >
                            {/* Rank */}
                            <span className="text-xs font-bold text-gray-400 w-5 shrink-0 text-right">
                              {i + 1}
                            </span>

                            {/* Bar + label */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                                  {z.zone}
                                </span>
                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                  <span className="text-xs font-bold text-gray-900">{z.count}</span>
                                  {z.avgBudget > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                      ~USD {Math.round(z.avgBudget / 1000)}k
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${color} rounded-full transition-all`}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          </Link>
                        )
                      })}

                      <p className="text-[11px] text-gray-400 text-center pt-1">
                        Basado en {marketStats.totalActive} pedidos activos
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Property type breakdown */}
              {marketStats && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Distribución por tipo de propiedad
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(marketStats.typeBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const total = Object.values(marketStats.typeBreakdown).reduce((a, b) => a + b, 0)
                        const pct = Math.round((count / total) * 100)
                        return (
                          <Link
                            key={type}
                            href={`/pedidos?type=${type}`}
                            className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl px-3 py-2 transition-colors group"
                          >
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                              {PROPERTY_TYPE_LABELS[type] || type}
                            </span>
                            <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-1.5 py-0.5">
                              {pct}%
                            </span>
                            <span className="text-xs text-gray-400">{count}</span>
                          </Link>
                        )
                      })}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* ── EDIT MODAL ─────────────────────────────────────────────────────── */}
      {editingPedido && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Editar búsqueda</h3>
              <button onClick={() => setEditingPedido(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Budget */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Presupuesto (USD)</label>
                <input
                  type="number"
                  value={editForm.budget_usd}
                  onChange={e => setEditForm(f => ({ ...f, budget_usd: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="ej: 80000"
                />
              </div>
              {/* Bedrooms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Dormitorios mín.</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.bedrooms_min}
                    onChange={e => setEditForm(f => ({ ...f, bedrooms_min: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Dormitorios máx.</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.bedrooms_max}
                    onChange={e => setEditForm(f => ({ ...f, bedrooms_max: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    placeholder="0"
                  />
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notas internas</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                  placeholder="Descripción adicional..."
                />
              </div>
              {/* Zones */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Zonas <span className="text-gray-400 font-normal">({editForm.zones.length} seleccionadas)</span>
                </label>
                {editForm.zones.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {editForm.zones.map(z => (
                      <span
                        key={z}
                        onClick={() => setEditForm(f => ({ ...f, zones: f.zones.filter(x => x !== z) }))}
                        className="inline-flex items-center gap-0.5 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        {z} <X className="h-3 w-3" />
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Buscar zona o barrio..."
                  value={zoneSearch}
                  onChange={e => setZoneSearch(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 mb-1"
                />
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                  {ZONES_CORDOBA
                    .filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase()))
                    .slice(0, 40)
                    .map(z => (
                      <label key={z} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0">
                        <input
                          type="checkbox"
                          checked={editForm.zones.includes(z)}
                          onChange={e => setEditForm(f => ({
                            ...f,
                            zones: e.target.checked ? [...f.zones, z] : f.zones.filter(x => x !== z),
                          }))}
                          className="rounded accent-teal-600"
                        />
                        {z}
                      </label>
                    ))}
                </div>
              </div>
              {editError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{editError}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingPedido(null)} disabled={editSaving}>
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={editSaving} className="bg-teal-600 hover:bg-teal-700">
                {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLOSE REASON MODAL ─────────────────────────────────────────────── */}
      {closeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Finalizar búsqueda</h3>
              <p className="text-sm text-gray-500 mt-1">
                ¿Por qué finalizás la búsqueda de <span className="font-medium text-gray-700">{closeTarget.name}</span>?
              </p>
            </div>
            <div className="p-5 space-y-2">
              {[
                { value: 'encontro_propiedad', label: 'El cliente encontró una propiedad' },
                { value: 'cliente_cancelo', label: 'El cliente canceló la búsqueda' },
                { value: 'ya_no_busca', label: 'Ya no está buscando' },
                { value: 'datos_incorrectos', label: 'Datos incorrectos o duplicado' },
                { value: 'otro', label: 'Otro motivo' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    closeReason === opt.value
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="close_reason"
                    value={opt.value}
                    checked={closeReason === opt.value}
                    onChange={() => setCloseReason(opt.value)}
                    className="accent-teal-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCloseTarget(null)} disabled={closeSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={confirmClose}
                disabled={!closeReason || closeSubmitting}
                className="bg-red-500 hover:bg-red-600"
              >
                {closeSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Finalizar búsqueda
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Survey modal (blocking) ─────────────────────────────── */}
      {pendingSurveys.length > 0 && (() => {
        const survey = pendingSurveys[0]
        const req = survey.request
        const purchasedDate = new Date(survey.purchased_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })
        const OUTCOMES = [
          { value: 'nada',             label: 'Nada' },
          { value: 'envie_opciones',   label: 'Envié opciones' },
          { value: 'hubo_visita',      label: 'Hubo visita' },
          { value: 'hubo_negociacion', label: 'Hubo negociación' },
          { value: 'hubo_reserva',     label: 'Hubo reserva' },
          { value: 'hubo_venta',       label: 'Hubo venta 🎉' },
        ]

        async function submitSurvey() {
          if (!surveyOutcome) return
          setSurveySubmitting(true)
          try {
            await fetch('/api/leads/survey', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lead_id: survey.lead_id, outcome: surveyOutcome }),
            })
            setPendingSurveys(prev => prev.slice(1))
            setSurveyOutcome('')
          } finally {
            setSurveySubmitting(false)
          }
        }

        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="bg-blue-600 px-6 py-4 rounded-t-2xl">
                <p className="text-white font-bold text-lg">📋 Encuesta de seguimiento</p>
                <p className="text-blue-100 text-sm mt-0.5">
                  Necesitamos saber cómo te fue para mejorar la plataforma
                </p>
              </div>
              <div className="px-6 py-5">
                {req && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm">
                    <p className="font-semibold text-gray-900">{req.contact_name}</p>
                    <p className="text-gray-500 mt-0.5">
                      {req.property_types.join(', ')} · {req.zones.slice(0, 2).join(', ')} · USD {req.budget_usd.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">Desbloqueado el {purchasedDate}</p>
                  </div>
                )}
                <p className="font-semibold text-gray-900 mb-3">¿Qué pasó con esta búsqueda?</p>
                <div className="space-y-2">
                  {OUTCOMES.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        surveyOutcome === opt.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="survey_outcome"
                        value={opt.value}
                        checked={surveyOutcome === opt.value}
                        onChange={() => setSurveyOutcome(opt.value)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {pendingSurveys.length > 1 && (
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    {pendingSurveys.length - 1} encuesta{pendingSurveys.length - 1 > 1 ? 's' : ''} más pendiente{pendingSurveys.length - 1 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="px-6 pb-5">
                <Button
                  onClick={submitSurvey}
                  disabled={!surveyOutcome || surveySubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {surveySubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
                    : 'Responder y continuar'
                  }
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
