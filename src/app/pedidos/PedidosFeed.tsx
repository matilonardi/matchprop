'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Clock, Eye, Lock, X, CalendarDays, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ZONES_CORDOBA, PROPERTY_TYPE_LABELS, FINANCING_LABELS, CAR_BODY_STYLE_LABELS } from '@/lib/constants'
import type { PublicBuyerRequest } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Car extra fields (not in PublicBuyerRequest type yet)
// ---------------------------------------------------------------------------
interface CarFields {
  car_body_styles?: string[]
  car_brands?: string[]
  car_year_min?: number | null
  car_year_max?: number | null
  car_condition?: string | null
  car_km_max?: number | null
  car_fuel_types?: string[]
  car_transmission?: string | null
  request_type?: string
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const DEMO_REQUESTS: (PublicBuyerRequest & { demo?: boolean })[] = [
  {
    id: 'demo-1', property_types: ['casa'], zones: ['Mendiolaza', 'Valle Escondido'],
    bedrooms_min: 3, bedrooms_max: 4, bathrooms_min: 2, budget_usd: 230000,
    financing: 'ambos', requirements: ['cochera', 'gas_natural', 'calles_asfaltadas'],
    description: 'Busco algo moderno, no más de 10 años de antigüedad. Cocina amplia integrada al living.',
    urgency: 'este_mes', status: 'active', views_count: 14, leads_count: 3,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 58 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-2', property_types: ['casa', 'duplex'], zones: ['Villa Belgrano', 'Cerro de las Rosas'],
    bedrooms_min: 3, bathrooms_min: 2, budget_usd: 620000,
    financing: 'efectivo', requirements: ['pileta', 'cochera', 'living_amplio'],
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
    financing: 'credito', requirements: ['calles_asfaltadas', 'gas_natural'],
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
    id: 'demo-6', property_types: ['departamento', 'duplex'], zones: ['Güemes', 'Nueva Córdoba', 'Alberdi'],
    bedrooms_min: 2, bathrooms_min: 1, budget_usd: 95000,
    financing: 'efectivo', requirements: ['luz_natural', 'terraza'],
    urgency: 'este_mes', status: 'active', views_count: 11, leads_count: 2,
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 24 * 24 * 3600000).toISOString(), demo: true,
  },
]

const DEMO_CAR_REQUESTS: (PublicBuyerRequest & CarFields & { demo?: boolean })[] = [
  {
    id: 'demo-car-1', property_types: [], zones: ['Córdoba Capital', 'Nueva Córdoba'],
    budget_usd: 18000, financing: 'efectivo',
    requirements: [], description: 'Busco Toyota Corolla o similar, 2019 en adelante. Buen estado.',
    urgency: 'este_mes', status: 'active', views_count: 8, leads_count: 1,
    request_type: 'car', car_body_styles: ['sedan'], car_brands: ['Toyota', 'Honda'],
    car_year_min: 2019, car_condition: 'usado', car_km_max: 80000,
    car_fuel_types: ['nafta'], car_transmission: 'automatico',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 57 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-car-2', property_types: [], zones: ['Mendiolaza', 'Villa Allende', 'La Calera'],
    budget_usd: 35000, financing: 'efectivo',
    requirements: [], description: 'Necesito una SUV para familia. Ford Kuga, Nissan Kicks o similar. GNC ideal.',
    urgency: 'en_3_meses', status: 'active', views_count: 12, leads_count: 2,
    request_type: 'car', car_body_styles: ['suv'], car_brands: ['Ford', 'Nissan', 'Hyundai'],
    car_year_min: 2020, car_year_max: 2024, car_condition: 'usado', car_km_max: 60000,
    car_fuel_types: ['nafta', 'gnc'],
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 54 * 24 * 3600000).toISOString(), demo: true,
  },
  {
    id: 'demo-car-3', property_types: [], zones: ['Centro', 'General Paz', 'Güemes'],
    budget_usd: 12000, financing: 'efectivo',
    requirements: [], description: 'Busco auto chico económico para ciudad. Cualquier marca.',
    urgency: 'esta_semana', status: 'active', views_count: 5, leads_count: 0,
    request_type: 'car', car_body_styles: ['hatchback', 'sedan'], car_brands: [],
    car_condition: 'usado', car_km_max: 100000, car_fuel_types: ['gnc', 'nafta'],
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 50 * 24 * 3600000).toISOString(), demo: true,
  },
]

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
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

const CAR_TYPE_CONFIG: Record<string, { gradient: string; emoji: string }> = {
  suv:         { gradient: 'from-slate-500 to-zinc-600',   emoji: '🚙' },
  sedan:       { gradient: 'from-blue-500 to-indigo-600',  emoji: '🚗' },
  pickup:      { gradient: 'from-amber-500 to-orange-600', emoji: '🛻' },
  hatchback:   { gradient: 'from-violet-500 to-purple-600',emoji: '🚗' },
  monovolumen: { gradient: 'from-teal-500 to-cyan-600',    emoji: '🚐' },
  coupe:       { gradient: 'from-red-500 to-rose-600',     emoji: '🏎️' },
  default:     { gradient: 'from-gray-500 to-slate-600',   emoji: '🚗' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
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
          <div className="flex items-start gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-orange-400 mt-0.5" />
            <span className="leading-relaxed">
              <span className="text-gray-400">Busca en: </span>
              {req.zones.slice(0, 2).join(', ')}{req.zones.length > 2 ? ` +${req.zones.length - 2} zonas` : ''}
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
                : 'bg-orange-500 group-hover:bg-orange-600 text-white shadow-sm hover:shadow-md'
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

function CarRequestCard({ req, isDemo }: { req: PublicBuyerRequest & CarFields; isDemo?: boolean }) {
  const primaryStyle = req.car_body_styles?.[0] || 'default'
  const { gradient, emoji } = CAR_TYPE_CONFIG[primaryStyle] || CAR_TYPE_CONFIG.default
  const styleLabels = req.car_body_styles?.map((s) => CAR_BODY_STYLE_LABELS[s] || s) || []

  return (
    <Link href={isDemo ? '#' : `/pedidos/${req.id}`} onClick={isDemo ? (e) => e.preventDefault() : undefined}>
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-100 transition-all duration-200 cursor-pointer h-full flex flex-col group">
        {/* Same header pattern as RequestCard but with car gradient */}
        <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          <span className="text-7xl select-none opacity-75">{emoji}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="bg-white/95 backdrop-blur-sm text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">✓ Activa</span>
          </div>
          {isDemo && (
            <div className="absolute top-3 left-3">
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">Ejemplo</span>
            </div>
          )}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
              <Eye className="h-3.5 w-3.5" />{req.views_count} vista{req.views_count !== 1 ? 's' : ''}
            </div>
            <div className="text-white/70 text-xs">{timeAgo(req.created_at)}</div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-2.5">
          {/* Budget */}
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            USD {req.budget_usd.toLocaleString()}
          </div>

          {/* Body style */}
          <p className="text-sm font-semibold text-gray-800">
            {styleLabels.join(' · ') || 'Auto'}
          </p>

          {/* Brands */}
          <p className="text-sm text-gray-500">
            {(req.car_brands?.length ?? 0) > 0 ? req.car_brands!.slice(0, 3).join(', ') : 'Cualquier marca'}
          </p>

          {/* Location */}
          <div className="flex items-start gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-orange-400 mt-0.5" />
            <span className="leading-relaxed">
              <span className="text-gray-400">Busca en: </span>
              {req.zones.slice(0, 2).join(', ')}{req.zones.length > 2 ? ` +${req.zones.length - 2} zonas` : ''}
            </span>
          </div>

          {/* Year + condition */}
          <div className="flex items-center gap-4 text-sm text-gray-600 py-2.5 border-y border-gray-100">
            {(req.car_year_min || req.car_year_max) && (
              <span className="flex items-center gap-1.5">
                📅 {req.car_year_min || '...'}{req.car_year_max ? `–${req.car_year_max}` : '+'}
              </span>
            )}
            {req.car_condition && (
              <span className="text-xs">
                {req.car_condition === 'nuevo' ? '✨ 0km' : req.car_condition === 'usado' ? '🔑 Usado' : '🔄 Cualquiera'}
              </span>
            )}
            {req.car_km_max && (
              <span className="text-xs text-gray-400 ml-auto">
                ≤{(req.car_km_max / 1000).toFixed(0)}k km
              </span>
            )}
          </div>

          {/* Fuel types */}
          {(req.car_fuel_types?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {req.car_fuel_types!.map((f) => (
                <span key={f} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                  ⛽ {f}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-1">
            <div className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${isDemo ? 'bg-gray-100 text-gray-400' : 'bg-orange-500 group-hover:bg-orange-600 text-white shadow-sm'}`}>
              <Lock className="h-3.5 w-3.5" />
              {isDemo ? 'Contacto oculto · ejemplo' : 'Ver contacto · 1 crédito'}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
interface FeedProps {
  initialZone?: string
  initialType?: string
  initialFinancing?: string
  initialMaxBudget?: string
  initialSince?: string
}

export default function PedidosFeed({
  initialZone = '',
  initialType = '',
  initialFinancing = '',
  initialMaxBudget = '',
  initialSince = '',
}: FeedProps) {
  const [activeTab, setActiveTab] = useState<'property' | 'car'>('property')
  const [requests, setRequests] = useState<(PublicBuyerRequest & CarFields)[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showingDemo, setShowingDemo] = useState(false)

  const [filters, setFilters] = useState({
    zone: initialZone,
    types: initialType ? [initialType] : [] as string[],  // multi-select
    carCondition: '',
    financing: initialFinancing,
    maxBudget: initialMaxBudget,
    since: initialSince,
  })
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)

  const hasFilters = !!(filters.zone || filters.types.length || filters.carCondition || filters.financing || filters.maxBudget || filters.since)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    params.set('requestType', activeTab)
    if (filters.zone) params.set('zone', filters.zone)
    if (activeTab === 'property' && filters.types.length) params.set('types', filters.types.join(','))
    if (activeTab === 'car' && filters.carCondition) params.set('condition', filters.carCondition)
    if (filters.financing) params.set('financing', filters.financing)
    if (filters.maxBudget) params.set('maxBudget', filters.maxBudget)
    if (filters.since) params.set('since', filters.since)

    try {
      const res = await fetch(`/api/pedidos?${params}`)
      const json = await res.json()
      const data = json.data || []
      const noFilterApplied = !filters.zone && !filters.types.length && !filters.financing && !filters.maxBudget
      if (data.length === 0 && page === 1 && noFilterApplied) {
        setRequests(activeTab === 'car' ? DEMO_CAR_REQUESTS : DEMO_REQUESTS)
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
      setRequests(activeTab === 'car' ? DEMO_CAR_REQUESTS : DEMO_REQUESTS)
      setTotalPages(1)
      setTotal(0)
      setShowingDemo(true)
    }
    setLoading(false)
  }, [page, filters, activeTab])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  function handleFilterChange(key: string, value: string | null) {
    setFilters((f) => ({ ...f, [key]: !value || value === 'todos' || value === 'todas' ? '' : value }))
    setPage(1)
  }

  function toggleTypeFilter(typeId: string) {
    setFilters((f) => ({
      ...f,
      types: f.types.includes(typeId) ? f.types.filter((t) => t !== typeId) : [...f.types, typeId],
    }))
    setPage(1)
  }

  const pillBase = 'rounded-full text-sm font-medium border transition-colors w-full h-9'
  const pillActive = 'border-orange-500 bg-orange-50 text-orange-700'
  const pillInactive = 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-2xl p-1 w-fit">
        {[
          { id: 'property', label: '🏠 Propiedades' },
          { id: 'car', label: '🚗 Autos' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id as 'property' | 'car')
              setFilters({ zone: '', types: [], carCondition: '', financing: '', maxBudget: '', since: '' })
              setTypeDropdownOpen(false)
              setPage(1)
            }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">

        {/* Zona */}
        <div className="shrink-0 w-48">
          <Select value={filters.zone || 'todos'} onValueChange={(v) => handleFilterChange('zone', v)}>
            <SelectTrigger className={`${pillBase} ${filters.zone ? pillActive : pillInactive} px-4`}>
              <span className="flex items-center gap-1 truncate text-left">
                <span className="shrink-0 font-medium">📍 Zona:</span>
                <span className="truncate">{filters.zone || 'todas'}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las zonas</SelectItem>
              {ZONES_CORDOBA.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo — multi-select for property, single for car */}
        {activeTab === 'property' ? (
          <div className="shrink-0 relative">
            <button
              onClick={() => setTypeDropdownOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                filters.types.length ? pillActive : pillInactive
              }`}
            >
              <span className="font-medium">🏠 Tipo:</span>
              {filters.types.length === 0
                ? 'todos'
                : filters.types.length === 1
                  ? PROPERTY_TYPE_LABELS[filters.types[0]]
                  : `${filters.types.length} tipos`
              }
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </button>
            {typeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTypeDropdownOpen(false)} />
                <div className="absolute top-10 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-52">
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(k)}
                        onChange={() => toggleTypeFilter(k)}
                        className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="shrink-0 w-48">
            <Select value={filters.carCondition || 'todos'} onValueChange={(v) => handleFilterChange('carCondition', v)}>
              <SelectTrigger className={`${pillBase} ${filters.carCondition ? pillActive : pillInactive} px-4`}>
                <span className="flex items-center gap-1 truncate text-left">
                  <span className="shrink-0 font-medium">🚗 Condición:</span>
                  <span className="truncate">{filters.carCondition === 'nuevo' ? '0km' : filters.carCondition === 'usado' ? 'usado' : 'todas'}</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquier condición</SelectItem>
                <SelectItem value="nuevo">✨ 0km</SelectItem>
                <SelectItem value="usado">🔑 Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Presupuesto */}
        <div className="shrink-0 w-52">
          <Select value={filters.maxBudget || 'todos'} onValueChange={(v) => handleFilterChange('maxBudget', v)}>
            <SelectTrigger className={`${pillBase} ${filters.maxBudget ? pillActive : pillInactive} px-4`}>
              <span className="flex items-center gap-1 truncate text-left">
                <span className="shrink-0 font-medium">💰 Hasta:</span>
                <span className="truncate">{filters.maxBudget ? `USD ${parseInt(filters.maxBudget).toLocaleString()}` : 'cualquier precio'}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cualquier precio</SelectItem>
              {activeTab === 'property' ? (
                <>
                  <SelectItem value="100000">USD 100.000</SelectItem>
                  <SelectItem value="200000">USD 200.000</SelectItem>
                  <SelectItem value="350000">USD 350.000</SelectItem>
                  <SelectItem value="500000">USD 500.000</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="10000">USD 10.000</SelectItem>
                  <SelectItem value="20000">USD 20.000</SelectItem>
                  <SelectItem value="40000">USD 40.000</SelectItem>
                  <SelectItem value="80000">USD 80.000</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Financiación (solo propiedades) */}
        {activeTab === 'property' && (
          <div className="shrink-0 w-52">
            <Select value={filters.financing || 'todos'} onValueChange={(v) => handleFilterChange('financing', v)}>
              <SelectTrigger className={`${pillBase} ${filters.financing ? pillActive : pillInactive} px-4`}>
                <span className="flex items-center gap-1 truncate text-left">
                  <span className="shrink-0 font-medium">💳 Pago:</span>
                  <span className="truncate">{
                    filters.financing === 'efectivo' ? 'efectivo'
                    : filters.financing === 'credito' ? 'crédito'
                    : filters.financing === 'permuta_propiedad' ? 'permuta prop.'
                    : filters.financing === 'permuta_auto' ? 'permuta auto'
                    : filters.financing === 'ambos' ? 'efvo. o crédito'
                    : 'cualquiera'
                  }</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquier forma</SelectItem>
                <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                <SelectItem value="credito">🏦 Crédito hipotecario</SelectItem>
                <SelectItem value="permuta_propiedad">🏠 Permuta de propiedad</SelectItem>
                <SelectItem value="permuta_auto">🚗 Permuta de auto</SelectItem>
                <SelectItem value="ambos">Efectivo o Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Fecha */}
        <div className="shrink-0 w-48">
          <Select value={filters.since || 'todas'} onValueChange={(v) => handleFilterChange('since', v)}>
            <SelectTrigger className={`${pillBase} ${filters.since ? pillActive : pillInactive} px-4`}>
              <span className="flex items-center gap-1 truncate text-left">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span className="shrink-0 font-medium ml-0.5">Fecha:</span>
                <span className="truncate">{
                  filters.since === '24h' ? 'hoy'
                  : filters.since === '7d' ? 'esta semana'
                  : filters.since === '30d' ? 'este mes'
                  : 'cualquiera'
                }</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Cualquier fecha</SelectItem>
              <SelectItem value="24h">🔥 Últimas 24 horas</SelectItem>
              <SelectItem value="7d">📅 Última semana</SelectItem>
              <SelectItem value="30d">🗓️ Último mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setFilters({ zone: '', types: [], carCondition: '', financing: '', maxBudget: '', since: '' })
              setPage(1)
            }}
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
          {activeTab === 'car'
            ? `${total} búsqueda${total !== 1 ? 's' : ''} de autos activa${total !== 1 ? 's' : ''}`
            : `${total} pedido${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}`}
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
            activeTab === 'car' ? (
              <CarRequestCard
                key={req.id}
                req={req}
                isDemo={(req as PublicBuyerRequest & CarFields & { demo?: boolean }).demo}
              />
            ) : (
              <RequestCard
                key={req.id}
                req={req}
                isDemo={(req as PublicBuyerRequest & { demo?: boolean }).demo}
              />
            )
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
