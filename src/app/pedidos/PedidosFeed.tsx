'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Bed, Bath, Clock, Eye, Lock, X, CalendarDays, ChevronDown, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ZONAS_CORDOBA, ZONES_CORDOBA, PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'
import type { PublicBuyerRequest } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'


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
function RequestCard({ req }: { req: PublicBuyerRequest }) {
  const primaryType = req.property_types[0]
  const { gradient, emoji } = TYPE_CONFIG[primaryType] || { gradient: 'from-blue-400 to-blue-600', emoji: '🏠' }
  const typeLabels = req.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t)

  return (
    <Link href={`/pedidos/${req.id}`}>
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
          {req.featured_until && new Date(req.featured_until) > new Date() && (
            <div className="absolute top-3 left-3">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                ⭐ Destacado
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
              {req.budget_usd === 999999
                ? 'Sin límite'
                : (req as any).budget_ars
                  ? `$ ${((req as any).budget_ars as number).toLocaleString('es-AR')}`
                  : req.budget_usd === 0
                    ? 'Sin Precio Definido'
                    : `USD ${req.budget_usd.toLocaleString()}`}
              {req.operation_type === 'alquiler' && <span className="text-sm font-normal text-gray-400">/mes</span>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {req.operation_type === 'alquiler' && (
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">🔑 Alquiler</span>
              )}
              {(!req.operation_type || req.operation_type === 'compra') && req.financing && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {FINANCING_LABELS[req.financing]}
                </span>
              )}
            </div>
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
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-orange-500 group-hover:bg-orange-600 text-white shadow-sm hover:shadow-md">
              <Lock className="h-3.5 w-3.5" />
              Ver contacto · 1 crédito
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

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
interface FiltersState {
  zones: string[]
  barrios: string[]
  types: string[]
  bedroomsMin: string[]
  financing: string
  minBudget: string
  maxBudget: string
  minBudgetArs: string
  maxBudgetArs: string
  since: string
  dateFrom: string
  dateTo: string
  sort: string
  publisherType: string
  operationType: string
}

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
  const [requests, setRequests] = useState<PublicBuyerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedBrokerId, setLoggedBrokerId] = useState<string | null>(null)
  const [gridKey, setGridKey] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const FILTER_SESSION_KEY = 'pedidos_filters'

  const [filters, setFilters] = useState<FiltersState>(() => {
    const hasInitial = initialZone || initialType || initialFinancing || initialMaxBudget || initialSince
    if (!hasInitial && typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(FILTER_SESSION_KEY)
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return {
      zones: initialZone ? [initialZone] : [] as string[],
      barrios: [] as string[],
      types: initialType ? [initialType] : [] as string[],
      bedroomsMin: [] as string[],
      financing: initialFinancing,
      minBudget: '',
      maxBudget: initialMaxBudget,
      minBudgetArs: '',
      maxBudgetArs: '',
      since: initialSince,
      dateFrom: '',
      dateTo: '',
      sort: 'recent',
      publisherType: '',
      operationType: '',
    }
  })
  const [textSearch, setTextSearch] = useState('')
  const [debouncedTextSearch, setDebouncedTextSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [zoneSearch, setZoneSearch] = useState('')
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false)
  const [pendingZones, setPendingZones] = useState<string[]>([])
  const [barrioSearch, setBarrioSearch] = useState('')
  const [barrioDropdownOpen, setBarrioDropdownOpen] = useState(false)
  const [pendingBarrios, setPendingBarrios] = useState<string[]>([])
  const [pendingTypes, setPendingTypes] = useState<string[]>([])
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  // Persist filters to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(FILTER_SESSION_KEY, JSON.stringify(filters)) } catch {}
  }, [filters])

  // Detect logged-in broker (fire-and-forget, non-blocking)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      fetch(`/api/broker/me?userId=${user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.broker?.id && setLoggedBrokerId(d.broker.id))
        .catch(() => {})
    })
  }, [])

  // Debounce text search 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedTextSearch(textSearch)
      setPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [textSearch])

  const hasFilters = !!(filters.zones.length || filters.barrios.length || filters.types.length || filters.bedroomsMin.length || filters.financing || filters.minBudget || filters.maxBudget || filters.minBudgetArs || filters.maxBudgetArs || filters.since || filters.dateFrom || filters.dateTo || filters.sort !== 'recent' || filters.publisherType || filters.operationType || debouncedTextSearch)

  const SORT_OPTIONS = [
    { id: 'recent',     label: '🕐 Más recientes' },
    { id: 'oldest',     label: '📅 Más antiguos' },
    { id: 'budget_asc', label: '💰 Menor presupuesto' },
    { id: 'budget_desc',label: '💰 Mayor presupuesto' },
  ]

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (debouncedTextSearch) params.set('q', debouncedTextSearch)
    const allZones = [...filters.zones, ...filters.barrios]
    if (allZones.length) params.set('zones', allZones.join(','))
    if (filters.types.length) params.set('types', filters.types.join(','))
    if (filters.bedroomsMin.length) params.set('bedroomsMin', filters.bedroomsMin.join(','))
    if (filters.financing) params.set('financing', filters.financing)
    if (filters.minBudget) params.set('minBudget', filters.minBudget)
    if (filters.maxBudget) params.set('maxBudget', filters.maxBudget)
    if (filters.minBudgetArs) params.set('minBudgetArs', filters.minBudgetArs)
    if (filters.maxBudgetArs) params.set('maxBudgetArs', filters.maxBudgetArs)
    if (filters.since) params.set('since', filters.since)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)
    if (filters.sort && filters.sort !== 'recent') params.set('sort', filters.sort)
    if (filters.publisherType === 'mis' && loggedBrokerId) params.set('brokerPublisherId', loggedBrokerId)
    else if (filters.publisherType) params.set('publisherType', filters.publisherType)
    if (filters.operationType) params.set('operationType', filters.operationType)

    try {
      const res = await fetch(`/api/pedidos?${params}`)
      const json = await res.json()
      const data = json.data || []
      setRequests(data)
      setTotalPages(json.totalPages || 1)
      setTotal(json.count || 0)
    } catch {
      setRequests([])
      setTotalPages(1)
      setTotal(0)
    }
    setLoading(false)
    setGridKey((k) => k + 1)
  }, [page, filters, debouncedTextSearch, loggedBrokerId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  function fmtMiles(raw: string) {
    return raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  }

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

  function toggleBedroomsFilter(val: string) {
    setFilters((f) => ({
      ...f,
      bedroomsMin: f.bedroomsMin.includes(val) ? [] : [val],
    }))
    setPage(1)
  }

  const pillBase = 'rounded-full text-sm font-medium border transition-colors w-full h-9'
  const pillActive = 'border-orange-500 bg-orange-50 text-orange-700'
  const pillInactive = 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'

  return (
    <div>

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
      <div className="animate-tab-fade relative z-10 flex items-center gap-2 flex-wrap mb-6">

        {/* Zona — macro sectores */}
        <div className="shrink-0 relative">
          <button
            onClick={() => {
              if (zoneDropdownOpen) { setFilters(f => ({ ...f, zones: pendingZones })); setPage(1) }
              else { setPendingZones(filters.zones); setBarrioDropdownOpen(false); setSortDropdownOpen(false); setDateDropdownOpen(false) }
              setZoneDropdownOpen(v => !v)
            }}
            className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${filters.zones.length ? pillActive : pillInactive}`}
          >
            <span className="font-medium">📍 Zona:</span>
            {filters.zones.length === 0 ? 'todas' : filters.zones.length === 1 ? filters.zones[0] : `${filters.zones.length} zonas`}
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {zoneDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setFilters(f => ({ ...f, zones: pendingZones })); setPage(1); setZoneDropdownOpen(false) }} />
              <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-64">
                <label className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={pendingZones.length === 0}
                    onChange={() => setPendingZones([])}
                    className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                  />
                  Todas
                </label>
                <div className="max-h-72 overflow-y-auto">
                  {ZONAS_CORDOBA.map((z) => (
                    <label key={z} className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm hover:bg-gray-50 ${pendingZones.includes(z) ? 'bg-orange-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={pendingZones.includes(z)}
                        onChange={() => setPendingZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z])}
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

        {/* Barrio — búsqueda en los 261 barrios */}
        <div className="shrink-0 relative">
          <button
            onClick={() => {
              if (barrioDropdownOpen) { setFilters(f => ({ ...f, barrios: pendingBarrios })); setPage(1) }
              else { setPendingBarrios(filters.barrios); setZoneDropdownOpen(false); setSortDropdownOpen(false); setDateDropdownOpen(false) }
              setBarrioDropdownOpen(v => !v)
            }}
            className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${filters.barrios.length ? pillActive : pillInactive}`}
          >
            <span className="font-medium">🏘️ Barrio:</span>
            {filters.barrios.length === 0 ? 'todos' : filters.barrios.length === 1 ? filters.barrios[0] : `${filters.barrios.length} barrios`}
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {barrioDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setFilters(f => ({ ...f, barrios: pendingBarrios })); setPage(1); setBarrioDropdownOpen(false) }} />
              <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-72">
                <label className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={pendingBarrios.length === 0}
                    onChange={() => setPendingBarrios([])}
                    className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                  />
                  Todos
                </label>
                <div className="px-3 pt-2 pb-1">
                  <input
                    type="text"
                    placeholder="Buscar barrio..."
                    value={barrioSearch}
                    onChange={(e) => setBarrioSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {ZONES_CORDOBA.filter(b => !barrioSearch || b.toLowerCase().includes(barrioSearch.toLowerCase())).map((b) => (
                    <label key={b} className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm hover:bg-gray-50 ${pendingBarrios.includes(b) ? 'bg-orange-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={pendingBarrios.includes(b)}
                        onChange={() => setPendingBarrios(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])}
                        className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tipo — multi-select */}
        <div className="shrink-0 relative">
            <button
              onClick={() => {
                if (typeDropdownOpen) { setFilters(f => ({ ...f, types: pendingTypes })); setPage(1) }
                else { setPendingTypes(filters.types); setZoneDropdownOpen(false); setBarrioDropdownOpen(false) }
                setTypeDropdownOpen(v => !v)
              }}
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
                <div className="fixed inset-0 z-40" onClick={() => { setFilters(f => ({ ...f, types: pendingTypes })); setPage(1); setTypeDropdownOpen(false) }} />
                <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-52">
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 text-sm">
                      <input
                        type="checkbox"
                        checked={pendingTypes.includes(k)}
                        onChange={() => setPendingTypes(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                        className="rounded border-gray-300 accent-orange-500 h-4 w-4"
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </>
            )}
        </div>

        {/* Dormitorios — multi-select */}
        <div className="shrink-0 flex items-center gap-1">
            <span className="text-sm font-medium text-gray-500 mr-1">🛏 Dorm:</span>
            {['1','2','3','4'].map((v) => (
              <button
                key={v}
                onClick={() => toggleBedroomsFilter(v)}
                className={`h-9 px-3 rounded-full text-sm font-medium border transition-colors ${
                  filters.bedroomsMin.includes(v) ? pillActive : pillInactive
                }`}
              >
                {v}+
              </button>
            ))}
          </div>

        {/* Presupuesto Desde */}
        <div
          className={`shrink-0 flex items-center gap-1.5 rounded-full text-sm font-medium border transition-colors h-9 px-3 ${filters.minBudget ? pillActive : pillInactive}`}
        >
          <span className="shrink-0 font-medium">💰 USD mín:</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="libre"
            value={fmtMiles(filters.minBudget)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '')
              handleFilterChange('minBudget', raw || null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-20 min-w-0 bg-transparent outline-none placeholder:text-current placeholder:opacity-40"
          />
        </div>

        {/* Presupuesto Hasta */}
        <div
          className={`shrink-0 flex items-center gap-1.5 rounded-full text-sm font-medium border transition-colors h-9 px-3 ${filters.maxBudget ? pillActive : pillInactive}`}
        >
          <span className="shrink-0 font-medium">💰 USD máx:</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="libre"
            value={fmtMiles(filters.maxBudget)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '')
              handleFilterChange('maxBudget', raw || null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-20 min-w-0 bg-transparent outline-none placeholder:text-current placeholder:opacity-40"
          />
        </div>

        {/* Presupuesto ARS mín */}
        <div
          className={`shrink-0 flex items-center gap-1.5 rounded-full text-sm font-medium border transition-colors h-9 px-3 ${filters.minBudgetArs ? pillActive : pillInactive}`}
        >
          <span className="shrink-0 font-medium">🏠 $ mín:</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="libre"
            value={fmtMiles(filters.minBudgetArs)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '')
              handleFilterChange('minBudgetArs', raw || null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-24 min-w-0 bg-transparent outline-none placeholder:text-current placeholder:opacity-40"
          />
        </div>

        {/* Presupuesto ARS máx */}
        <div
          className={`shrink-0 flex items-center gap-1.5 rounded-full text-sm font-medium border transition-colors h-9 px-3 ${filters.maxBudgetArs ? pillActive : pillInactive}`}
        >
          <span className="shrink-0 font-medium">🏠 $ máx:</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="libre"
            value={fmtMiles(filters.maxBudgetArs)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '')
              handleFilterChange('maxBudgetArs', raw || null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-24 min-w-0 bg-transparent outline-none placeholder:text-current placeholder:opacity-40"
          />
        </div>

        {/* Financiación */}
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

        {/* Operación: compra / alquiler */}
        <div className="shrink-0">
            <Select value={filters.operationType || 'todos'} onValueChange={(v) => { setFilters(f => ({ ...f, operationType: v === 'todos' ? '' : v })); setPage(1) }}>
              <SelectTrigger className={`${pillBase} ${filters.operationType ? pillActive : pillInactive} px-4`}>
                <span className="flex items-center gap-1 truncate text-left">
                  <span className="shrink-0 font-medium">🔄 Operación:</span>
                  <span className="truncate">{
                    filters.operationType === 'compra' ? 'Compra'
                    : filters.operationType === 'alquiler' ? 'Alquiler'
                    : 'todas'
                  }</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="compra">🏠 Compra</SelectItem>
                <SelectItem value="alquiler">🔑 Alquiler</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {/* Quién publica */}
        <div className="shrink-0">
            <Select value={filters.publisherType || 'todos'} onValueChange={(v) => handleFilterChange('publisherType', v === 'todos' ? '' : v)}>
              <SelectTrigger className={`${pillBase} ${filters.publisherType ? pillActive : pillInactive} px-4`}>
                <span className="flex items-center gap-1 truncate text-left">
                  <span className="shrink-0 font-medium">👤 Publica:</span>
                  <span className="truncate">{
                    filters.publisherType === 'mis' ? 'Mis pedidos'
                    : filters.publisherType === 'particular' ? 'Particular'
                    : filters.publisherType === 'inmobiliaria' ? 'Inmobiliaria'
                    : 'cualquiera'
                  }</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cualquiera</SelectItem>
                {loggedBrokerId && (
                  <SelectItem value="mis">🔖 Mis pedidos</SelectItem>
                )}
                <SelectItem value="particular">🙋 Particular</SelectItem>
                <SelectItem value="inmobiliaria">🏢 Inmobiliaria</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              setFilters({ zones: [], barrios: [], types: [], bedroomsMin: [] as string[], financing: '', minBudget: '', maxBudget: '', minBudgetArs: '', maxBudgetArs: '', since: '', dateFrom: '', dateTo: '', sort: 'recent', publisherType: '', operationType: '' })
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
      {!loading && (
        <p className="text-sm font-medium text-gray-600 mb-5">
          {`${total} pedido${total !== 1 ? 's' : ''} activo${total !== 1 ? 's' : ''}`}
        </p>
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
              <RequestCard req={req} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Anterior
          </button>

          {/* Números de página */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '...'
                  ? <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                  : <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                        page === p
                          ? 'bg-orange-500 text-white border border-orange-500'
                          : 'border border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      {p}
                    </button>
              )
            }
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Siguiente →
          </button>

          {/* Ir a página */}
          <form
            onSubmit={e => {
              e.preventDefault()
              const val = parseInt((e.currentTarget.elements.namedItem('gotoPage') as HTMLInputElement).value)
              if (val >= 1 && val <= totalPages) { setPage(val); (e.currentTarget.elements.namedItem('gotoPage') as HTMLInputElement).value = '' }
            }}
            className="flex items-center gap-1.5 ml-2"
          >
            <span className="text-xs text-gray-400">Ir a</span>
            <input
              name="gotoPage"
              type="number"
              min={1}
              max={totalPages}
              placeholder={String(page)}
              className="w-14 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
          </form>
        </div>
      )}
    </div>
  )
}
