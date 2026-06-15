'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Clock, Eye, Lock, X, CalendarDays, ChevronDown, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ZONES_CORDOBA, PROPERTY_TYPE_LABELS, FINANCING_LABELS, CAR_BODY_STYLE_LABELS, CAR_BRANDS, CAR_FUEL_TYPES, CAR_TRANSMISSION_OPTIONS } from '@/lib/constants'
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
    <Link href={isDemo ? '#' : `/pedidos/${req.id}`} onClick={isDemo ? (e) => e.preventDefault() : undefined}>
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-100/60 border border-gray-100 hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full flex flex-col group">

        {/* Visual header */}
        <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          <span className="text-7xl select-none opacity-75 group-hover:scale-110 group-hover:opacity-90 transition-all duration-500">{emoji}</span>
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
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-100/60 border border-gray-100 hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full flex flex-col group">
        {/* Same header pattern as RequestCard but with car gradient */}
        <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          <span className="text-7xl select-none opacity-75 group-hover:scale-110 group-hover:opacity-90 transition-all duration-500">{emoji}</span>
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
  const [gridKey, setGridKey] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showingDemo, setShowingDemo] = useState(false)

  const [filters, setFilters] = useState({
    zones: initialZone ? [initialZone] : [] as string[],
    types: initialType ? [initialType] : [] as string[],
    bedroomsMin: '',
    carCondition: '',
    carBrands: [] as string[],
    carTransmission: '',
    carFuels: [] as string[],
    carKmMax: '',
    financing: initialFinancing,
    minBudget: '',
    maxBudget: initialMaxBudget,
    since: initialSince,
    dateFrom: '',
    dateTo: '',
    sort: 'recent',
    publisherType: '',
  })
  const [textSearch, setTextSearch] = useState('')
  const [debouncedTextSearch, setDebouncedTextSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [zoneSearch, setZoneSearch] = useState('')
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false)
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [carBrandDropdownOpen, setCarBrandDropdownOpen] = useState(false)
  const [carFuelDropdownOpen, setCarFuelDropdownOpen] = useState(false)

  // Debounce text search 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedTextSearch(textSearch)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [textSearch])

  const hasFilters = !!(filters.zones.length || filters.types.length || filters.bedroomsMin || filters.carCondition || filters.carBrands.length || filters.carTransmission || filters.carFuels.length || filters.carKmMax || filters.financing || filters.minBudget || filters.maxBudget || filters.since || filters.dateFrom || filters.dateTo || filters.sort !== 'recent' || filters.publisherType || debouncedTextSearch)

  const SORT_OPTIONS = [
    { id: 'recent',     label: '🕐 Más recientes' },
    { id: 'oldest',     label: '📅 Más antiguos' },
    { id: 'budget_asc', label: '💰 Menor presupuesto' },
    { id: 'budget_desc',label: '💰 Mayor presupuesto' },
  ]

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    params.set('requestType', activeTab)
    if (debouncedTextSearch) params.set('q', debouncedTextSearch)
    if (filters.zones.length) params.set('zones', filters.zones.join(','))
    if (activeTab === 'property' && filters.types.length) params.set('types', filters.types.join(','))
    if (activeTab === 'property' && filters.bedroomsMin) params.set('bedroomsMin', filters.bedroomsMin)
    if (activeTab === 'car' && filters.carCondition) params.set('condition', filters.carCondition)
    if (activeTab === 'car' && filters.carBrands.length) params.set('carBrands', filters.carBrands.join(','))
    if (activeTab === 'car' && filters.carTransmission) params.set('carTransmission', filters.carTransmission)
    if (activeTab === 'car' && filters.carFuels.length) params.set('carFuels', filters.carFuels.join(','))
    if (activeTab === 'car' && filters.carKmMax) params.set('carKmMax', filters.carKmMax)
    if (filters.financing) params.set('financing', filters.financing)
    if (filters.minBudget) params.set('minBudget', String(parseInt(filters.minBudget) * 1000))
    if (filters.maxBudget) params.set('maxBudget', String(parseInt(filters.maxBudget) * 1000))
    if (filters.since) params.set('since', filters.since)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (filters.sort && filters.sort !== 'recent') params.set('sort', filters.sort)
    if (filters.publisherType) params.set('publisherType', filters.publisherType)

    try {
      const res = await fetch(`/api/pedidos?${params}`)
      const json = await res.json()
      const data = json.data || []
      const noFilterApplied = !filters.zones.length && !filters.types.length && !filters.financing && !filters.maxBudget
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
    setGridKey((k) => k + 1)
  }, [page, filters, activeTab, debouncedTextSearch])

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
              setFilters({ zones: [], types: [], bedroomsMin: '', carCondition: '', carBrands: [], carTransmission: '', carFuels: [], carKmMax: '', financing: '', minBudget: '', maxBudget: '', since: '', dateFrom: '', dateTo: '', sort: 'recent', publisherType: '' })
              setTextSearch('')
              setDebouncedTextSearch('')
              setZoneDropdownOpen(false)
              setTypeDropdownOpen(false)
              setDateDropdownOpen(false)
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

      {/* Text search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={textSearch}
          onChange={e => setTextSearch(e.target.value)}
          placeholder="Buscar por descripción, zona, tipo de propiedad..."
          className="w-full h-11 pl-11 pr-10 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 shadow-sm transition-all"
        />
        {textSearch && (
          <button
            onClick={() => { setTextSearch(''); setDebouncedTextSearch(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div key={activeTab} className="animate-tab-fade relative z-10 flex items-center gap-2 flex-wrap mb-6">

        {/* Zona — multi-select */}
        <div className="shrink-0 relative">
          <button
            onClick={() => { setZoneDropdownOpen(v => !v); setSortDropdownOpen(false); setDateDropdownOpen(false) }}
            className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${filters.zones.length ? pillActive : pillInactive}`}
          >
            <span className="font-medium">📍 Zona:</span>
            {filters.zones.length === 0 ? 'todas' : filters.zones.length === 1 ? filters.zones[0] : `${filters.zones.length} zonas`}
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {zoneDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setZoneDropdownOpen(false)} />
              <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-64">
                <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="🔍 Buscar zona..."
                    value={zoneSearch}
                    onChange={e => setZoneSearch(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-300"
                  />
                </div>
                {zoneSearch === '' && (
                  <label className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={filters.zones.length === ZONES_CORDOBA.length}
                      onChange={(e) => {
                        setFilters(f => ({ ...f, zones: e.target.checked ? [...ZONES_CORDOBA] : [] }))
                        setPage(1)
                      }}
                      className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                    />
                    Todas las zonas
                  </label>
                )}
                <div className="max-h-56 overflow-y-auto py-1">
                  {ZONES_CORDOBA.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase())).map((z) => (
                    <label key={z} className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm hover:bg-gray-50 ${filters.zones.includes(z) ? 'bg-orange-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={filters.zones.includes(z)}
                        onChange={() => {
                          setFilters(f => ({ ...f, zones: f.zones.includes(z) ? f.zones.filter(x => x !== z) : [...f.zones, z] }))
                          setPage(1)
                        }}
                        className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                      />
                      {z}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
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
                <div className="fixed inset-0 z-40" onClick={() => setTypeDropdownOpen(false)} />
                <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-52">
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
        ) : (<>
          {/* Condición */}
          <div className="shrink-0 w-44">
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

          {/* Marca — multi-select dropdown */}
          <div className="shrink-0 relative">
            <button
              onClick={() => { setCarBrandDropdownOpen(v => !v); setCarFuelDropdownOpen(false); setZoneDropdownOpen(false); setDateDropdownOpen(false); setSortDropdownOpen(false) }}
              className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${filters.carBrands.length ? pillActive : pillInactive}`}
            >
              <span className="font-medium">🏷️ Marca:</span>
              {filters.carBrands.length === 0 ? 'todas' : filters.carBrands.length === 1 ? filters.carBrands[0] : `${filters.carBrands.length} marcas`}
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </button>
            {carBrandDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCarBrandDropdownOpen(false)} />
                <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-48 py-2 max-h-64 overflow-y-auto">
                  {CAR_BRANDS.map((brand) => (
                    <label key={brand} className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 text-sm ${filters.carBrands.includes(brand) ? 'bg-orange-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={filters.carBrands.includes(brand)}
                        onChange={() => {
                          setFilters(f => ({ ...f, carBrands: f.carBrands.includes(brand) ? f.carBrands.filter(x => x !== brand) : [...f.carBrands, brand] }))
                          setPage(1)
                        }}
                        className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                      />
                      {brand}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Transmisión */}
          <div className="shrink-0 w-44">
            <Select value={filters.carTransmission || 'todos'} onValueChange={(v) => handleFilterChange('carTransmission', v)}>
              <SelectTrigger className={`${pillBase} ${filters.carTransmission ? pillActive : pillInactive} px-4`}>
                <span className="flex items-center gap-1 truncate text-left">
                  <span className="shrink-0 font-medium">⚙️ Caja:</span>
                  <span className="truncate">{filters.carTransmission === 'manual' ? 'Manual' : filters.carTransmission === 'automatico' ? 'Auto.' : 'todas'}</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquier caja</SelectItem>
                {CAR_TRANSMISSION_OPTIONS.filter(o => o.id !== 'cualquiera').map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Combustible — multi-select dropdown */}
          <div className="shrink-0 relative">
            <button
              onClick={() => { setCarFuelDropdownOpen(v => !v); setCarBrandDropdownOpen(false); setZoneDropdownOpen(false); setDateDropdownOpen(false); setSortDropdownOpen(false) }}
              className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${filters.carFuels.length ? pillActive : pillInactive}`}
            >
              <span className="font-medium">⛽ Combustible:</span>
              {filters.carFuels.length === 0 ? 'todos' : filters.carFuels.length === 1 ? CAR_FUEL_TYPES.find(f => f.id === filters.carFuels[0])?.label || filters.carFuels[0] : `${filters.carFuels.length} tipos`}
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </button>
            {carFuelDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCarFuelDropdownOpen(false)} />
                <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-44 py-2">
                  {CAR_FUEL_TYPES.map(({ id, label }) => (
                    <label key={id} className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 text-sm ${filters.carFuels.includes(id) ? 'bg-orange-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={filters.carFuels.includes(id)}
                        onChange={() => {
                          setFilters(f => ({ ...f, carFuels: f.carFuels.includes(id) ? f.carFuels.filter(x => x !== id) : [...f.carFuels, id] }))
                          setPage(1)
                        }}
                        className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* KM máximos — solo para usados */}
          {(filters.carCondition === 'usado' || !filters.carCondition) && (
            <div
              className={`shrink-0 flex items-center gap-1.5 rounded-full text-sm font-medium border transition-colors h-9 px-3 ${filters.carKmMax ? pillActive : pillInactive}`}
              style={{ width: '12rem' }}
            >
              <span className="shrink-0 font-medium">🔢 KM máx:</span>
              <input
                type="number"
                min="0"
                step="10000"
                placeholder="libre"
                value={filters.carKmMax || ''}
                onChange={(e) => { setFilters(f => ({ ...f, carKmMax: e.target.value || '' })); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-full min-w-0 bg-transparent outline-none placeholder:text-current placeholder:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          )}
        </>)}

        {/* Dormitorios — solo propiedades */}
        {activeTab === 'property' && (
          <div className="shrink-0 w-44">
            <Select value={filters.bedroomsMin || 'todos'} onValueChange={(v) => handleFilterChange('bedroomsMin', v)}>
              <SelectTrigger className={`${pillBase} ${filters.bedroomsMin ? pillActive : pillInactive} px-4`}>
                <span className="flex items-center gap-1 truncate text-left">
                  <span className="shrink-0 font-medium">🛏 Dorm.:</span>
                  <span className="truncate">{filters.bedroomsMin ? `${filters.bedroomsMin}+` : 'todos'}</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquier cantidad</SelectItem>
                <SelectItem value="1">1+ dormitorio</SelectItem>
                <SelectItem value="2">2+ dormitorios</SelectItem>
                <SelectItem value="3">3+ dormitorios</SelectItem>
                <SelectItem value="4">4+ dormitorios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Presupuesto Desde */}
        <div
          className={`shrink-0 flex items-center gap-1 rounded-full text-sm font-medium border transition-colors h-9 px-3 ${filters.minBudget ? pillActive : pillInactive}`}
          style={{ width: '12rem' }}
        >
          <span className="shrink-0 font-medium">💰 Desde: $</span>
          <input
            type="number"
            min="0"
            step="10"
            placeholder="libre"
            value={filters.minBudget || ''}
            onChange={(e) => handleFilterChange('minBudget', e.target.value || null)}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-full min-w-0 bg-transparent outline-none placeholder:text-current placeholder:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="shrink-0 text-xs opacity-60">k</span>
        </div>

        {/* Presupuesto Hasta */}
        <div
          className={`shrink-0 flex items-center gap-1 rounded-full text-sm font-medium border transition-colors h-9 px-3 ${filters.maxBudget ? pillActive : pillInactive}`}
          style={{ width: '12rem' }}
        >
          <span className="shrink-0 font-medium">💰 Hasta: $</span>
          <input
            type="number"
            min="0"
            step="10"
            placeholder="libre"
            value={filters.maxBudget || ''}
            onChange={(e) => handleFilterChange('maxBudget', e.target.value || null)}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-full min-w-0 bg-transparent outline-none placeholder:text-current placeholder:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="shrink-0 text-xs opacity-60">k</span>
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

        {/* Quién publica (solo propiedades) */}
        {activeTab === 'property' && (
          <div className="shrink-0">
            <Select value={filters.publisherType || 'todos'} onValueChange={(v) => handleFilterChange('publisherType', v === 'todos' ? '' : v)}>
              <SelectTrigger className={`${pillBase} ${filters.publisherType ? pillActive : pillInactive} px-4`}>
                <span className="flex items-center gap-1 truncate text-left">
                  <span className="shrink-0 font-medium">👤 Publica:</span>
                  <span className="truncate">{
                    filters.publisherType === 'particular' ? 'Particular'
                    : filters.publisherType === 'inmobiliaria' ? 'Inmobiliaria'
                    : 'cualquiera'
                  }</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquiera</SelectItem>
                <SelectItem value="particular">🙋 Particular</SelectItem>
                <SelectItem value="inmobiliaria">🏢 Inmobiliaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Fecha — presets + rango personalizado */}
        <div className="shrink-0 relative">
          <button
            onClick={() => { setDateDropdownOpen(v => !v); setZoneDropdownOpen(false); setSortDropdownOpen(false) }}
            className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${(filters.since || filters.dateFrom || filters.dateTo) ? pillActive : pillInactive}`}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">Fecha:</span>
            {filters.dateFrom || filters.dateTo
              ? `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`
              : filters.since === '24h' ? 'hoy'
              : filters.since === '7d' ? 'esta semana'
              : filters.since === '30d' ? 'este mes'
              : 'cualquiera'}
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {dateDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDateDropdownOpen(false)} />
              <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-64 p-3">
                {/* Presets */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rápido</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { id: '24h', label: '🔥 Hoy' },
                    { id: '7d',  label: '📅 Esta semana' },
                    { id: '30d', label: '🗓️ Este mes' },
                    { id: '',    label: '✖ Cualquiera' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFilters(f => ({ ...f, since: opt.id, dateFrom: '', dateTo: '' }))
                        setPage(1)
                        setDateDropdownOpen(false)
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors text-left ${filters.since === opt.id && !filters.dateFrom ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Custom range */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rango personalizado</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={e => { setFilters(f => ({ ...f, dateFrom: e.target.value, since: '' })); setPage(1) }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={e => { setFilters(f => ({ ...f, dateTo: e.target.value, since: '' })); setPage(1) }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ordenar */}
        <div className="shrink-0 relative">
          <button
            onClick={() => { setSortDropdownOpen(v => !v); setZoneDropdownOpen(false); setDateDropdownOpen(false) }}
            className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${filters.sort !== 'recent' ? pillActive : pillInactive}`}
          >
            <span className="font-medium">↕ Ordenar:</span>
            {SORT_OPTIONS.find(o => o.id === filters.sort)?.label.replace(/^[^\s]+\s/, '') || 'recientes'}
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {sortDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
              <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-52 py-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setFilters(f => ({ ...f, sort: opt.id })); setPage(1); setSortDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${filters.sort === opt.id ? 'text-orange-600 font-semibold bg-orange-50' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setFilters({ zones: [], types: [], bedroomsMin: '', carCondition: '', carBrands: [], carTransmission: '', carFuels: [], carKmMax: '', financing: '', minBudget: '', maxBudget: '', since: '', dateFrom: '', dateTo: '', sort: 'recent', publisherType: '' })
              setTextSearch('')
              setDebouncedTextSearch('')
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
        <div className="relative isolate grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <div key={gridKey} className="relative isolate grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((req, i) => (
            <div
              key={req.id}
              className="animate-card-enter"
              style={{ animationDelay: `${Math.min(i * 55, 400)}ms` }}
            >
              {activeTab === 'car' ? (
                <CarRequestCard
                  req={req}
                  isDemo={(req as PublicBuyerRequest & CarFields & { demo?: boolean }).demo}
                />
              ) : (
                <RequestCard
                  req={req}
                  isDemo={(req as PublicBuyerRequest & { demo?: boolean }).demo}
                />
              )}
            </div>
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
