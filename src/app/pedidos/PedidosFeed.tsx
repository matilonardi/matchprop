'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Clock, Eye, Lock, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ZONES_CORDOBA, PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'
import type { PublicBuyerRequest } from '@/lib/supabase'

const DEMO_REQUESTS: (PublicBuyerRequest & { demo?: boolean })[] = [
  {
    id: 'demo-1', property_types: ['casa'], zones: ['Mendiolaza', 'Valle Escondido'],
    bedrooms_min: 3, bedrooms_max: 4, bathrooms_min: 2, budget_usd: 230000,
    financing: 'ambos', requirements: ['seguridad', 'cochera', 'gas_natural', 'calles_asfaltadas'],
    description: 'Busco algo moderno, no más de 10 años de antigüedad. Cocina amplia integrada al living.',
    urgency: 'este_mes', status: 'active', views_count: 14, leads_count: 3,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 58 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-2', property_types: ['casa', 'duplex'], zones: ['Villa Belgrano', 'Cerro de las Rosas'],
    bedrooms_min: 3, bathrooms_min: 2, budget_usd: 620000,
    financing: 'efectivo', requirements: ['seguridad', 'pileta', 'cochera', 'living_amplio'],
    description: 'Solo barrios cerrados: Los Cielos, Santina, Los Árboles o Los Sueños. Living amplio imprescindible.',
    urgency: 'flexible', status: 'active', views_count: 9, leads_count: 2,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 55 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-3', property_types: ['departamento'], zones: ['Nueva Córdoba', 'General Paz'],
    bedrooms_min: 1, bedrooms_max: 2, bathrooms_min: 1, budget_usd: 70000,
    financing: 'credito', requirements: ['luz_natural', 'cochera'],
    urgency: 'esta_semana', status: 'active', views_count: 21, leads_count: 5,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 52 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-4', property_types: ['casa'], zones: ['Mendiolaza', 'Valle del Sol', 'Sierra Nueva'],
    bedrooms_min: 3, bathrooms_min: 1, budget_usd: 150000,
    financing: 'credito', requirements: ['seguridad', 'calles_asfaltadas', 'gas_natural'],
    urgency: 'en_3_meses', status: 'active', views_count: 6, leads_count: 1,
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 42 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-5', property_types: ['casa', 'duplex'], zones: ['Unquillo', 'Rio Ceballos', 'La Calera'],
    bedrooms_min: 2, bedrooms_max: 3, bathrooms_min: 1, budget_usd: 120000,
    financing: 'ambos', requirements: ['jardin', 'gas_natural'],
    description: 'Buscamos algo tranquilo, con jardín para los chicos. No es urgente pero queremos cerrar antes de fin de año.',
    urgency: 'flexible', status: 'active', views_count: 4, leads_count: 0,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 34 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-6', property_types: ['departamento', 'ph'], zones: ['Güemes', 'Nueva Córdoba', 'Alberdi'],
    bedrooms_min: 2, bathrooms_min: 1, budget_usd: 95000,
    financing: 'efectivo', requirements: ['luz_natural', 'terraza'],
    urgency: 'este_mes', status: 'active', views_count: 11, leads_count: 2,
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 24 * 24 * 3600000).toISOString(), demo: true,
  },
]

const TYPE_CONFIG: Record<string, { gradient: string; emoji: string }> = {
  casa:         { gradient: 'from-emerald-400 to-teal-500',    emoji: '🏡' },
  departamento: { gradient: 'from-blue-400 to-indigo-500',     emoji: '🏢' },
  duplex:       { gradient: 'from-violet-400 to-purple-500',   emoji: '🏘️' },
  ph:           { gradient: 'from-cyan-400 to-sky-500',        emoji: '🏠' },
  terreno:      { gradient: 'from-amber-400 to-orange-500',    emoji: '🌿' },
  local:        { gradient: 'from-orange-400 to-red-500',      emoji: '🏪' },
  renta:        { gradient: 'from-green-400 to-emerald-500',   emoji: '💵' },
  revaluo:      { gradient: 'from-pink-400 to-rose-500',       emoji: '📈' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `hace ${days}d`
  if (hours > 0) return `hace ${hours}h`
  return 'recién'
}

function urgencyLabel(urgency?: string): string {
  const map: Record<string, string> = {
    esta_semana: 'Esta semana',
    este_mes: 'Este mes',
    en_3_meses: 'En 3 meses',
    flexible: 'Flexible',
  }
  return urgency ? (map[urgency] || urgency) : ''
}

function RequestCard({ req, isDemo }: { req: PublicBuyerRequest; isDemo?: boolean }) {
  const primaryType = req.property_types[0]
  const { gradient, emoji } = TYPE_CONFIG[primaryType] || { gradient: 'from-blue-400 to-blue-600', emoji: '🏠' }
  const typeLabels = req.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t)

  return (
    <Link
      href={isDemo ? '#' : `/pedidos/${req.id}`}
      onClick={isDemo ? (e) => e.preventDefault() : undefined}
    >
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-100 transition-all duration-200 cursor-pointer h-full flex flex-col group">

        {/* Visual header */}
        <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          <span className="text-7xl select-none opacity-75">{emoji}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute top-3 right-3">
            <span className="bg-white/95 backdrop-blur-sm text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              ✓ Activa
            </span>
          </div>
          {isDemo && (
            <div className="absolute top-3 left-3">
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                Ejemplo
              </span>
            </div>
          )}

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
              <Eye className="h-3.5 w-3.5" />
              {req.views_count} vista{req.views_count !== 1 ? 's' : ''}
            </div>
            <div className="text-white/70 text-xs">{timeAgo(req.created_at)}</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-2.5">

          {/* Price + financing */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {req.budget_usd === 999999 ? 'Sin límite' : `USD ${req.budget_usd.toLocaleString()}`}
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
              {FINANCING_LABELS[req.financing]}
            </span>
          </div>

          {/* Type */}
          <p className="text-sm font-semibold text-gray-800 capitalize leading-snug">
            {typeLabels.join(' · ')}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
            <span className="truncate">
              {req.zones.slice(0, 2).join(', ')}{req.zones.length > 2 ? ` +${req.zones.length - 2}` : ''}
            </span>
          </div>

          {/* Stats row */}
          {(req.bedrooms_min || req.bathrooms_min || req.urgency) && (
            <div className="flex items-center gap-4 text-sm text-gray-600 py-2.5 border-y border-gray-100">
              {req.bedrooms_min && (
                <span className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-gray-400" />
                  {req.bedrooms_min}{req.bedrooms_max ? `–${req.bedrooms_max}` : '+'} dorm.
                </span>
              )}
              {req.bathrooms_min && (
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-gray-400" />
                  {req.bathrooms_min}+ baños
                </span>
              )}
              {req.urgency && (
                <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                  <Clock className="h-3.5 w-3.5" />
                  {urgencyLabel(req.urgency)}
                </span>
              )}
            </div>
          )}

          {/* Requirements */}
          {req.requirements?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {req.requirements.slice(0, 3).map((r) => (
                <span key={r} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                  {r.replace(/_/g, ' ')}
                </span>
              ))}
              {req.requirements.length > 3 && (
                <span className="text-xs text-gray-400 flex items-center px-1">
                  +{req.requirements.length - 3} más
                </span>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-1">
            <div className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDemo
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 group-hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}>
              <Lock className="h-3.5 w-3.5" />
              {isDemo ? 'Contacto oculto · ejemplo' : 'Ver contacto · 1 crédito'}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default function PedidosFeed() {
  const [requests, setRequests] = useState<PublicBuyerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showingDemo, setShowingDemo] = useState(false)

  const [filters, setFilters] = useState({
    zone: '',
    type: '',
    financing: '',
    maxBudget: '',
  })

  const hasFilters = !!(filters.zone || filters.type || filters.financing || filters.maxBudget)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filters.zone) params.set('zone', filters.zone)
    if (filters.type) params.set('type', filters.type)
    if (filters.financing) params.set('financing', filters.financing)
    if (filters.maxBudget) params.set('maxBudget', filters.maxBudget)

    try {
      const res = await fetch(`/api/pedidos?${params}`)
      const json = await res.json()
      const data = json.data || []
      if (data.length === 0 && page === 1 && !filters.zone && !filters.type && !filters.financing && !filters.maxBudget) {
        setRequests(DEMO_REQUESTS)
        setTotalPages(1)
        setTotal(0)
        setShowingDemo(true)
      } else {
        setRequests(data)
        setTotalPages(json.totalPages || 1)
        setTotal(json.count || 0)
        setShowingDemo(false)
      }
    } catch {
      setRequests(DEMO_REQUESTS)
      setTotalPages(1)
      setTotal(0)
      setShowingDemo(true)
    }
    setLoading(false)
  }, [page, filters])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  function handleFilterChange(key: string, value: string | null) {
    setFilters((f) => ({ ...f, [key]: !value || value === 'todos' ? '' : value }))
    setPage(1)
  }

  const pillBase = 'rounded-full text-sm font-medium border transition-colors w-full h-9'
  const pillActive = 'border-blue-500 bg-blue-50 text-blue-700'
  const pillInactive = 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'

  return (
    <div>
      {/* Pill filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">

        <div className="shrink-0 w-44">
          <Select value={filters.zone || 'todos'} onValueChange={(v) => handleFilterChange('zone', v)}>
            <SelectTrigger className={`${pillBase} ${filters.zone ? pillActive : pillInactive} px-4`}>
              <SelectValue placeholder="📍 Zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">📍 Todas las zonas</SelectItem>
              {ZONES_CORDOBA.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="shrink-0 w-52">
          <Select value={filters.type || 'todos'} onValueChange={(v) => handleFilterChange('type', v)}>
            <SelectTrigger className={`${pillBase} ${filters.type ? pillActive : pillInactive} px-4`}>
              <SelectValue placeholder="🏠 Tipo de propiedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">🏠 Todos los tipos</SelectItem>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="shrink-0 w-44">
          <Select value={filters.maxBudget || 'todos'} onValueChange={(v) => handleFilterChange('maxBudget', v)}>
            <SelectTrigger className={`${pillBase} ${filters.maxBudget ? pillActive : pillInactive} px-4`}>
              <SelectValue placeholder="💰 Presupuesto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">💰 Cualquier precio</SelectItem>
              <SelectItem value="100000">Hasta USD 100k</SelectItem>
              <SelectItem value="200000">Hasta USD 200k</SelectItem>
              <SelectItem value="350000">Hasta USD 350k</SelectItem>
              <SelectItem value="500000">Hasta USD 500k</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="shrink-0 w-48">
          <Select value={filters.financing || 'todos'} onValueChange={(v) => handleFilterChange('financing', v)}>
            <SelectTrigger className={`${pillBase} ${filters.financing ? pillActive : pillInactive} px-4`}>
              <SelectValue placeholder="💳 Forma de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">💳 Cualquier forma</SelectItem>
              <SelectItem value="efectivo">💵 Efectivo</SelectItem>
              <SelectItem value="credito">🏦 Crédito hipotecario</SelectItem>
              <SelectItem value="permuta_propiedad">🏠 Permuta de propiedad</SelectItem>
              <SelectItem value="permuta_auto">🚗 Permuta de auto</SelectItem>
              <SelectItem value="ambos">Efectivo o Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <button
            onClick={() => { setFilters({ zone: '', type: '', financing: '', maxBudget: '' }); setPage(1) }}
            className="shrink-0 h-9 flex items-center gap-1.5 px-4 rounded-full text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && !showingDemo && (
        <p className="text-sm font-medium text-gray-600 mb-5">
          {total} pedido{total !== 1 ? 's' : ''} activo{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Demo banner */}
      {!loading && showingDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-sm text-amber-800">
          <p className="font-semibold mb-0.5">Estos son pedidos de ejemplo</p>
          <p className="text-amber-700 text-xs">
            Así se verá el feed cuando los compradores publiquen sus búsquedas. Los pedidos reales incluyen contacto desbloqueable con 1 crédito.
          </p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-sm">
              <div className="h-44 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 rounded-lg w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="flex gap-2 mt-2">
                  <div className="h-6 bg-gray-100 rounded-full w-16" />
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                </div>
                <div className="h-10 bg-gray-200 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">Sin pedidos con esos filtros</p>
          <p className="text-sm text-gray-500">Probá con otros criterios o eliminá los filtros</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              isDemo={(req as PublicBuyerRequest & { demo?: boolean }).demo}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">{page} de {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
