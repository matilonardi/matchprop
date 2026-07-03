'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Clock, Lock, X, CalendarDays, ChevronDown, Search,
  Home, Building2, Building, Store, Trees, Banknote, TrendingUp, Car,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ZONAS_CORDOBA, ZONES_CORDOBA, PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'
import type { PublicBuyerRequest } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'


// ---------------------------------------------------------------------------
// Config — iconos de línea por tipo (sin emojis, estilo Tabler/lucide)
// ---------------------------------------------------------------------------
const TYPE_ICON: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  casa:         Home,
  departamento: Building2,
  duplex:       Building,
  ph:           Building2,
  terreno:      Trees,
  local:        Store,
  renta:        Banknote,
  revaluo:      TrendingUp,
}

function getTypeIcon(req: PublicBuyerRequest) {
  if (req.request_type === 'car') return Car
  return TYPE_ICON[req.property_types?.[0]] || Home
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

function priceText(req: PublicBuyerRequest): string {
  if (req.budget_usd === 999999) return 'Sin límite'
  if ((req as any).budget_ars) return `$ ${((req as any).budget_ars as number).toLocaleString('es-AR')}`
  if (req.budget_usd === 0) return 'A convenir'
  return `USD ${req.budget_usd.toLocaleString()}`
}

// ---------------------------------------------------------------------------
// Card — anatomía del diseño 2a (icono de línea, sin gradiente ni emoji)
// ---------------------------------------------------------------------------
function RequestCard({ req }: { req: PublicBuyerRequest }) {
  const Icon = getTypeIcon(req)
  const typeLabels = req.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t)
  const isRent = req.operation_type === 'alquiler'
  const opLabel = isRent ? 'Alquiler' : 'Compra'
  const featured = req.featured_until && new Date(req.featured_until) > new Date()

  // Chips: dormitorios + baños + requisitos
  const chips: string[] = []
  if (req.bedrooms_min) chips.push(`${req.bedrooms_min}${req.bedrooms_max ? `–${req.bedrooms_max}` : '+'} dorm.`)
  if (req.bathrooms_min) chips.push(`${req.bathrooms_min}+ baños`)
  ;(req.requirements || []).forEach((r) => chips.push(r.replace(/_/g, ' ')))
  const visibleChips = chips.slice(0, 3)
  const extraChips = chips.length - visibleChips.length

  const payLabel = isRent ? 'Alquiler' : (req.financing ? FINANCING_LABELS[req.financing] : '')

  return (
    <Link href={`/pedidos/${req.id}`} className="h-full">
      <article className="group h-full flex flex-col bg-white border border-hairline rounded-[14px] p-5 transition-colors hover:border-ink-3/40">

        {/* Header: icono + vistas · fecha */}
        <div className="flex items-center justify-between mb-4">
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-tint text-brand">
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="flex items-center gap-2 text-[13px] text-ink-3">
            {featured && <span className="text-brand font-semibold">Destacado</span>}
            <span>{req.views_count} vista{req.views_count !== 1 ? 's' : ''} · {timeAgo(req.created_at)}</span>
          </div>
        </div>

        {/* Precio + badge de pago */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xl font-bold text-ink tabular leading-tight">
            {priceText(req)}
            {isRent && <span className="text-sm font-normal text-ink-3">/mes</span>}
          </div>
          {payLabel && (
            <span className="shrink-0 text-xs font-medium text-brand bg-tint px-2.5 py-1 rounded-full">
              {payLabel}
            </span>
          )}
        </div>

        {/* Tipo · Operación · Zona */}
        <p className="mt-1.5 text-[15px] text-ink-2 leading-snug">
          {[typeLabels.join(' / ') || 'Propiedad', opLabel, req.zones.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
          {req.zones.length > 2 ? ` +${req.zones.length - 2}` : ''}
        </p>

        {/* Chips de requisitos */}
        {visibleChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleChips.map((c) => (
              <span key={c} className="rounded-md bg-chip px-2 py-1 text-xs text-ink-2 capitalize">{c}</span>
            ))}
            {extraChips > 0 && <span className="px-1 py-1 text-xs text-ink-3">+{extraChips}</span>}
          </div>
        )}

        {req.urgency && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-3">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
            {urgencyLabel(req.urgency)}
          </div>
        )}

        {/* Footer: contacto oculto + CTA gratis */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-hairline mt-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-3">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            Contacto oculto
          </span>
          <span className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-dark">
            Ver contacto
          </span>
        </div>
      </article>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
interface FiltersState {
  zones: string[]
  barrios: string[]
  types: string[]
  bedroomsMin: string
  bedroomsMax: string
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
      bedroomsMin: '',
      bedroomsMax: '',
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
  const [barrioSearch, setBarrioSearch] = useState('')
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false)
  const [pendingZones, setPendingZones] = useState<string[]>([])
  const [barrioDropdownOpen, setBarrioDropdownOpen] = useState(false)
  const [pendingBarrios, setPendingBarrios] = useState<string[]>([])
  const [pendingTypes, setPendingTypes] = useState<string[]>([])
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false)
  const [dormDropdownOpen, setDormDropdownOpen] = useState(false)
  const [pendingPriceCurrency, setPendingPriceCurrency] = useState<'usd' | 'ars'>('usd')
  const [pendingPriceMin, setPendingPriceMin] = useState('')
  const [pendingPriceMax, setPendingPriceMax] = useState('')
  const [pendingBedroomsMin, setPendingBedroomsMin] = useState('')
  const [pendingBedroomsMax, setPendingBedroomsMax] = useState('')

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

  const hasFilters = !!(filters.zones.length || filters.barrios.length || filters.types.length || filters.bedroomsMin || filters.bedroomsMax || filters.financing || filters.minBudget || filters.maxBudget || filters.minBudgetArs || filters.maxBudgetArs || filters.since || filters.dateFrom || filters.dateTo || filters.sort !== 'recent' || filters.publisherType || filters.operationType || debouncedTextSearch)

  const SORT_OPTIONS = [
    { id: 'recent',     label: 'Más recientes' },
    { id: 'oldest',     label: 'Más antiguos' },
    { id: 'budget_asc', label: 'Menor presupuesto' },
    { id: 'budget_desc',label: 'Mayor presupuesto' },
  ]

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (debouncedTextSearch) params.set('q', debouncedTextSearch)
    const allZones = [...filters.zones, ...filters.barrios]
    if (allZones.length) params.set('zones', allZones.join(','))
    if (filters.types.length) params.set('types', filters.types.join(','))
    if (filters.bedroomsMin) params.set('bedroomsMin', filters.bedroomsMin)
    if (filters.bedroomsMax) params.set('bedroomsMax', filters.bedroomsMax)
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

  function openPriceDropdown() {
    const hasDollar = !!(filters.minBudget || filters.maxBudget)
    const cur: 'usd' | 'ars' = hasDollar ? 'usd' : (filters.minBudgetArs || filters.maxBudgetArs) ? 'ars' : 'usd'
    setPendingPriceCurrency(cur)
    setPendingPriceMin(cur === 'usd' ? filters.minBudget : filters.minBudgetArs)
    setPendingPriceMax(cur === 'usd' ? filters.maxBudget : filters.maxBudgetArs)
    setPriceDropdownOpen(true)
    setDormDropdownOpen(false); setZoneDropdownOpen(false); setBarrioDropdownOpen(false)
    setTypeDropdownOpen(false); setDateDropdownOpen(false); setSortDropdownOpen(false)
  }

  function commitPrice() {
    setFilters(f => ({
      ...f,
      minBudget: pendingPriceCurrency === 'usd' ? pendingPriceMin : '',
      maxBudget: pendingPriceCurrency === 'usd' ? pendingPriceMax : '',
      minBudgetArs: pendingPriceCurrency === 'ars' ? pendingPriceMin : '',
      maxBudgetArs: pendingPriceCurrency === 'ars' ? pendingPriceMax : '',
    }))
    setPage(1)
    setPriceDropdownOpen(false)
  }

  function openDormDropdown() {
    setPendingBedroomsMin(filters.bedroomsMin)
    setPendingBedroomsMax(filters.bedroomsMax)
    setDormDropdownOpen(true)
    setPriceDropdownOpen(false); setZoneDropdownOpen(false); setBarrioDropdownOpen(false)
    setTypeDropdownOpen(false); setDateDropdownOpen(false); setSortDropdownOpen(false)
  }

  function commitDorm() {
    setFilters(f => ({ ...f, bedroomsMin: pendingBedroomsMin, bedroomsMax: pendingBedroomsMax }))
    setPage(1)
    setDormDropdownOpen(false)
  }

  // ── Estilos de pill del handoff: "Label gris + Valor bold + chevron" ──
  const pillBase = 'flex items-center gap-1.5 rounded-lg border px-3.5 h-10 text-sm whitespace-nowrap transition-colors'
  const pillActive = 'border-brand bg-tint text-brand'
  const pillInactive = 'border-field bg-white text-ink hover:border-ink-3'
  const pillClass = (active: boolean) => `${pillBase} ${active ? pillActive : pillInactive}`
  const menuClass = 'absolute top-12 left-0 z-50 bg-white border border-hairline rounded-xl shadow-lg'

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl md:text-[40px] font-extrabold text-ink tracking-[-0.02em] leading-none">
            Pedidos activos en Córdoba
          </h1>
          <p className="mt-3 text-ink-2">
            Compradores buscando ahora mismo · Contactalos gratis
          </p>
        </div>
        <p className="text-sm text-ink-2">
          {loading
            ? <span className="inline-block h-4 w-24 bg-chip rounded animate-pulse align-middle" />
            : <><span className="font-bold text-ink tabular">{total.toLocaleString('es-AR')}</span> pedido{total !== 1 ? 's' : ''} activo{total !== 1 ? 's' : ''}</>}
        </p>
      </div>

      {/* Text search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3 pointer-events-none" strokeWidth={1.5} />
        <input
          type="text"
          value={textSearch}
          onChange={e => setTextSearch(e.target.value)}
          placeholder="Buscar por descripción, zona, tipo de propiedad..."
          className="w-full h-11 pl-11 pr-10 rounded-lg border border-field bg-white text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
        />
        {textSearch && (
          <button
            onClick={() => { setTextSearch(''); setDebouncedTextSearch(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="relative z-10 flex items-center gap-2 flex-wrap pb-6 mb-6 border-b border-hairline">

        {/* Zona */}
        <div className="shrink-0 relative">
          <button
            onClick={() => {
              if (zoneDropdownOpen) { setFilters(f => ({ ...f, zones: pendingZones })); setPage(1) }
              else { setPendingZones(filters.zones); setBarrioDropdownOpen(false); setSortDropdownOpen(false); setDateDropdownOpen(false) }
              setZoneDropdownOpen(v => !v)
            }}
            className={pillClass(filters.zones.length > 0)}
          >
            <span className={filters.zones.length ? '' : 'text-ink-3'}>Zona</span>
            <span className="font-semibold">{filters.zones.length === 0 ? 'Todas' : filters.zones.length === 1 ? filters.zones[0] : `${filters.zones.length} zonas`}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {zoneDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setFilters(f => ({ ...f, zones: pendingZones })); setPage(1); setZoneDropdownOpen(false) }} />
              <div className={`${menuClass} w-64`}>
                <label className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer bg-chip border-b border-hairline text-sm font-medium text-ink hover:bg-tint">
                  <input type="checkbox" checked={pendingZones.length === 0} onChange={() => setPendingZones([])} className="rounded border-field accent-brand h-4 w-4" />
                  Todas
                </label>
                <div className="max-h-72 overflow-y-auto">
                  {ZONAS_CORDOBA.map((z) => (
                    <label key={z} className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm hover:bg-chip ${pendingZones.includes(z) ? 'bg-tint' : ''}`}>
                      <input type="checkbox" checked={pendingZones.includes(z)} onChange={() => setPendingZones(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z])} className="rounded border-field accent-brand h-4 w-4" />
                      {z}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Barrio */}
        <div className="shrink-0 relative">
          <button
            onClick={() => {
              if (barrioDropdownOpen) { setFilters(f => ({ ...f, barrios: pendingBarrios })); setPage(1) }
              else { setPendingBarrios(filters.barrios); setZoneDropdownOpen(false); setSortDropdownOpen(false); setDateDropdownOpen(false) }
              setBarrioDropdownOpen(v => !v)
            }}
            className={pillClass(filters.barrios.length > 0)}
          >
            <span className={filters.barrios.length ? '' : 'text-ink-3'}>Barrio</span>
            <span className="font-semibold">{filters.barrios.length === 0 ? 'Todos' : filters.barrios.length === 1 ? filters.barrios[0] : `${filters.barrios.length} barrios`}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {barrioDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setFilters(f => ({ ...f, barrios: pendingBarrios })); setPage(1); setBarrioDropdownOpen(false) }} />
              <div className={`${menuClass} w-72`}>
                <label className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer bg-chip border-b border-hairline text-sm font-medium text-ink hover:bg-tint">
                  <input type="checkbox" checked={pendingBarrios.length === 0} onChange={() => setPendingBarrios([])} className="rounded border-field accent-brand h-4 w-4" />
                  Todos
                </label>
                <div className="px-3 pt-2 pb-1">
                  <input type="text" placeholder="Buscar barrio..." value={barrioSearch} onChange={(e) => setBarrioSearch(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-field rounded-lg focus:outline-none focus:border-brand" onClick={(e) => e.stopPropagation()} />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {ZONES_CORDOBA.filter(b => !barrioSearch || b.toLowerCase().includes(barrioSearch.toLowerCase())).map((b) => (
                    <label key={b} className={`flex items-center gap-2.5 px-4 py-2 cursor-pointer text-sm hover:bg-chip ${pendingBarrios.includes(b) ? 'bg-tint' : ''}`}>
                      <input type="checkbox" checked={pendingBarrios.includes(b)} onChange={() => setPendingBarrios(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])} className="rounded border-field accent-brand h-4 w-4" />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tipo */}
        <div className="shrink-0 relative">
          <button
            onClick={() => {
              if (typeDropdownOpen) { setFilters(f => ({ ...f, types: pendingTypes })); setPage(1) }
              else { setPendingTypes(filters.types); setZoneDropdownOpen(false); setBarrioDropdownOpen(false) }
              setTypeDropdownOpen(v => !v)
            }}
            className={pillClass(filters.types.length > 0)}
          >
            <span className={filters.types.length ? '' : 'text-ink-3'}>Tipo</span>
            <span className="font-semibold">{filters.types.length === 0 ? 'Todos' : filters.types.length === 1 ? PROPERTY_TYPE_LABELS[filters.types[0]] : `${filters.types.length} tipos`}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {typeDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setFilters(f => ({ ...f, types: pendingTypes })); setPage(1); setTypeDropdownOpen(false) }} />
              <div className={`${menuClass} py-2 min-w-52`}>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-chip text-sm">
                    <input type="checkbox" checked={pendingTypes.includes(k)} onChange={() => setPendingTypes(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])} className="rounded border-field accent-brand h-4 w-4" />
                    {v}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Operación */}
        <div className="shrink-0 w-44">
          <Select value={filters.operationType || 'todos'} onValueChange={(v) => { setFilters(f => ({ ...f, operationType: v === 'todos' ? '' : v })); setPage(1) }}>
            <SelectTrigger className={`${pillClass(!!filters.operationType)} w-full`}>
              <span className="flex items-center gap-1.5 truncate">
                <span className={filters.operationType ? '' : 'text-ink-3'}>Operación</span>
                <span className="font-semibold truncate">{filters.operationType === 'compra' ? 'Compra' : filters.operationType === 'alquiler' ? 'Alquiler' : 'Todas'}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dormitorios */}
        <div className="shrink-0 relative">
          <button
            onClick={() => dormDropdownOpen ? commitDorm() : openDormDropdown()}
            className={pillClass(!!(filters.bedroomsMin || filters.bedroomsMax))}
          >
            <span className={(filters.bedroomsMin || filters.bedroomsMax) ? '' : 'text-ink-3'}>Dorm.</span>
            <span className="font-semibold">
              {!filters.bedroomsMin && !filters.bedroomsMax ? 'Cualquiera'
                : filters.bedroomsMin && filters.bedroomsMax ? `${filters.bedroomsMin}–${filters.bedroomsMax}`
                : filters.bedroomsMin ? `${filters.bedroomsMin}+` : `hasta ${filters.bedroomsMax}`}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {dormDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={commitDorm} />
              <div className={`${menuClass} w-64 p-4`}>
                <p className="text-[13px] font-bold uppercase tracking-wide text-ink-2 mb-3">Dormitorios</p>
                <div className="flex gap-2 mb-4">
                  <select value={pendingBedroomsMin} onChange={e => setPendingBedroomsMin(e.target.value)} className="flex-1 min-w-0 border border-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
                    <option value="">Sin mínimo</option>
                    {['1','2','3','4','5'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={pendingBedroomsMax} onChange={e => setPendingBedroomsMax(e.target.value)} className="flex-1 min-w-0 border border-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
                    <option value="">Sin máximo</option>
                    {['1','2','3','4','5'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-hairline">
                  <button onClick={() => { setPendingBedroomsMin(''); setPendingBedroomsMax('') }} className="text-sm text-ink-2 hover:text-ink font-medium">Limpiar</button>
                  <button onClick={commitDorm} className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors">Ver resultados</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Precio */}
        <div className="shrink-0 relative">
          {(() => {
            const hasUsd = !!(filters.minBudget || filters.maxBudget)
            const hasArs = !!(filters.minBudgetArs || filters.maxBudgetArs)
            const hasPriceFilter = hasUsd || hasArs
            const label = hasUsd
              ? `USD ${filters.minBudget ? fmtMiles(filters.minBudget) : '0'} – ${filters.maxBudget ? fmtMiles(filters.maxBudget) : '∞'}`
              : hasArs
                ? `$ ${filters.minBudgetArs ? fmtMiles(filters.minBudgetArs) : '0'} – ${filters.maxBudgetArs ? fmtMiles(filters.maxBudgetArs) : '∞'}`
                : 'Sin límite'
            return (
              <button onClick={() => priceDropdownOpen ? commitPrice() : openPriceDropdown()} className={pillClass(hasPriceFilter)}>
                <span className={hasPriceFilter ? '' : 'text-ink-3'}>Presupuesto</span>
                <span className="font-semibold tabular">{label}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
            )
          })()}
          {priceDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={commitPrice} />
              <div className={`${menuClass} w-72 p-4`}>
                <p className="text-[13px] font-bold uppercase tracking-wide text-ink-2 mb-3">Presupuesto</p>
                <div className="flex gap-4 mb-4">
                  {(['usd', 'ars'] as const).map(cur => (
                    <label key={cur} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-ink">
                      <input type="radio" name="priceCurrency" checked={pendingPriceCurrency === cur} onChange={() => { setPendingPriceCurrency(cur); setPendingPriceMin(''); setPendingPriceMax('') }} className="accent-brand h-4 w-4" />
                      {cur === 'usd' ? 'USD' : 'Pesos'}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" inputMode="numeric" placeholder="Desde" value={fmtMiles(pendingPriceMin)} onChange={e => setPendingPriceMin(e.target.value.replace(/\./g, '').replace(/\D/g, ''))} className="flex-1 min-w-0 border border-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
                  <input type="text" inputMode="numeric" placeholder="Hasta" value={fmtMiles(pendingPriceMax)} onChange={e => setPendingPriceMax(e.target.value.replace(/\./g, '').replace(/\D/g, ''))} className="flex-1 min-w-0 border border-field rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-hairline">
                  <button onClick={() => { setPendingPriceMin(''); setPendingPriceMax('') }} className="text-sm text-ink-2 hover:text-ink font-medium">Limpiar</button>
                  <button onClick={commitPrice} className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors">Ver resultados</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pago */}
        <div className="shrink-0 w-48">
          <Select value={filters.financing || 'todos'} onValueChange={(v) => handleFilterChange('financing', v)}>
            <SelectTrigger className={`${pillClass(!!filters.financing)} w-full`}>
              <span className="flex items-center gap-1.5 truncate">
                <span className={filters.financing ? '' : 'text-ink-3'}>Pago</span>
                <span className="font-semibold truncate">{
                  filters.financing === 'efectivo' ? 'Efectivo'
                  : filters.financing === 'credito' ? 'Crédito'
                  : filters.financing === 'permuta_propiedad' ? 'Permuta prop.'
                  : filters.financing === 'permuta_auto' ? 'Permuta auto'
                  : filters.financing === 'ambos' ? 'Efvo. o crédito'
                  : 'Cualquiera'
                }</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cualquier forma</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="credito">Crédito hipotecario</SelectItem>
              <SelectItem value="permuta_propiedad">Permuta de propiedad</SelectItem>
              <SelectItem value="permuta_auto">Permuta de auto</SelectItem>
              <SelectItem value="ambos">Efectivo o Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Publica */}
        <div className="shrink-0 w-44">
          <Select value={filters.publisherType || 'todos'} onValueChange={(v) => handleFilterChange('publisherType', v === 'todos' ? '' : v)}>
            <SelectTrigger className={`${pillClass(!!filters.publisherType)} w-full`}>
              <span className="flex items-center gap-1.5 truncate">
                <span className={filters.publisherType ? '' : 'text-ink-3'}>Publica</span>
                <span className="font-semibold truncate">{
                  filters.publisherType === 'mis' ? 'Mis pedidos'
                  : filters.publisherType === 'particular' ? 'Particular'
                  : filters.publisherType === 'inmobiliaria' ? 'Inmobiliaria'
                  : 'Cualquiera'
                }</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cualquiera</SelectItem>
              {loggedBrokerId && <SelectItem value="mis">Mis pedidos</SelectItem>}
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="inmobiliaria">Inmobiliaria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="shrink-0 relative">
          <button
            onClick={() => { setDateDropdownOpen(v => !v); setZoneDropdownOpen(false); setSortDropdownOpen(false) }}
            className={pillClass(!!(filters.since || filters.dateFrom || filters.dateTo))}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="font-semibold">
              {filters.dateFrom || filters.dateTo ? `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`
                : filters.since === '24h' ? 'Hoy'
                : filters.since === '7d' ? 'Esta semana'
                : filters.since === '30d' ? 'Este mes'
                : 'Cualquiera'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {dateDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDateDropdownOpen(false)} />
              <div className={`${menuClass} w-64 p-3`}>
                <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2">Rápido</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { id: '24h', label: 'Hoy' },
                    { id: '7d',  label: 'Esta semana' },
                    { id: '30d', label: 'Este mes' },
                    { id: '',    label: 'Cualquiera' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => { setFilters(f => ({ ...f, since: opt.id, dateFrom: '', dateTo: '' })); setPage(1); setDateDropdownOpen(false) }} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors text-left ${filters.since === opt.id && !filters.dateFrom ? 'border-brand bg-tint text-brand font-medium' : 'border-hairline text-ink-2 hover:bg-chip'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2">Rango personalizado</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-ink-2 mb-1 block">Desde</label>
                    <input type="date" value={filters.dateFrom} onChange={e => { setFilters(f => ({ ...f, dateFrom: e.target.value, since: '' })); setPage(1) }} className="w-full border border-field rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand" />
                  </div>
                  <div>
                    <label className="text-xs text-ink-2 mb-1 block">Hasta</label>
                    <input type="date" value={filters.dateTo} onChange={e => { setFilters(f => ({ ...f, dateTo: e.target.value, since: '' })); setPage(1) }} className="w-full border border-field rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ordenar — a la derecha */}
        <div className="shrink-0 relative ml-auto">
          <button
            onClick={() => { setSortDropdownOpen(v => !v); setZoneDropdownOpen(false); setDateDropdownOpen(false) }}
            className={pillClass(filters.sort !== 'recent')}
          >
            <span className={filters.sort !== 'recent' ? '' : 'text-ink-3'}>Ordenar</span>
            <span className="font-semibold">{SORT_OPTIONS.find(o => o.id === filters.sort)?.label || 'Más recientes'}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {sortDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
              <div className={`${menuClass} right-0 left-auto w-52 py-1`}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => { setFilters(f => ({ ...f, sort: opt.id })); setPage(1); setSortDropdownOpen(false) }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-chip transition-colors ${filters.sort === opt.id ? 'text-brand font-semibold bg-tint' : 'text-ink'}`}>
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
              setFilters({ zones: [], barrios: [], types: [], bedroomsMin: '', bedroomsMax: '', financing: '', minBudget: '', maxBudget: '', minBudgetArs: '', maxBudgetArs: '', since: '', dateFrom: '', dateTo: '', sort: 'recent', publisherType: '', operationType: '' })
              setTextSearch('')
              setDebouncedTextSearch('')
              setPage(1)
            }}
            className="shrink-0 h-10 flex items-center gap-1.5 px-3.5 rounded-lg text-sm font-medium text-ink-2 border border-field hover:border-ink-3 hover:text-ink transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="relative isolate grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-hairline rounded-[14px] p-5 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-[42px] w-[42px] rounded-[10px] bg-chip" />
                <div className="h-3 w-20 bg-chip rounded" />
              </div>
              <div className="h-6 bg-chip rounded w-1/2 mb-2" />
              <div className="h-4 bg-chip rounded w-3/4 mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-chip rounded w-16" />
                <div className="h-6 bg-chip rounded w-20" />
              </div>
              <div className="h-10 bg-chip rounded-lg" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tint text-brand">
            <Search className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-semibold text-ink mb-2">Sin pedidos con esos filtros</p>
          <p className="text-sm text-ink-2">Probá con otros criterios o eliminá los filtros</p>
        </div>
      ) : (
        <div key={gridKey} className="relative isolate grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((req, i) => (
            <div key={req.id} className="animate-card-enter" style={{ animationDelay: `${Math.min(i * 55, 400)}ms` }}>
              <RequestCard req={req} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-lg border border-field text-sm font-medium text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            ← Anterior
          </button>
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
                  ? <span key={`ellipsis-${idx}`} className="px-1 text-ink-3 text-sm">…</span>
                  : <button key={p} onClick={() => setPage(p as number)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-brand text-white border border-brand' : 'border border-field text-ink hover:border-brand hover:bg-tint'}`}>
                      {p}
                    </button>
              )}
          </div>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-field text-sm font-medium text-ink hover:border-ink-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Siguiente →
          </button>
          <form
            onSubmit={e => {
              e.preventDefault()
              const val = parseInt((e.currentTarget.elements.namedItem('gotoPage') as HTMLInputElement).value)
              if (val >= 1 && val <= totalPages) { setPage(val); (e.currentTarget.elements.namedItem('gotoPage') as HTMLInputElement).value = '' }
            }}
            className="flex items-center gap-1.5 ml-2"
          >
            <span className="text-xs text-ink-3">Ir a</span>
            <input name="gotoPage" type="number" min={1} max={totalPages} placeholder={String(page)} className="w-14 px-2 py-1.5 text-sm border border-field rounded-lg text-center focus:outline-none focus:border-brand" />
          </form>
        </div>
      )}
    </div>
  )
}
