'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, DollarSign, Bed, Bath, Clock, Eye, Lock, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ZONES_CORDOBA, PROPERTY_TYPE_LABELS, FINANCING_LABELS } from '@/lib/constants'
import type { PublicBuyerRequest } from '@/lib/supabase'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`
  if (hours > 0) return `hace ${hours}h`
  return 'hace unos minutos'
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

function RequestCard({ req }: { req: PublicBuyerRequest }) {
  const typeLabels = req.property_types.map((t) => PROPERTY_TYPE_LABELS[t] || t)

  return (
    <Link href={`/pedidos/${req.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm hover:border-blue-200 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {typeLabels.join(' / ')}
              </span>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-0">
                Activa
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              {req.zones.slice(0, 3).join(', ')}{req.zones.length > 3 ? ` +${req.zones.length - 3}` : ''}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-gray-900">
              USD {req.budget_usd.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{FINANCING_LABELS[req.financing]}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
          {req.bedrooms_min && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {req.bedrooms_min}{req.bedrooms_max ? `–${req.bedrooms_max}` : '+'} dorm.
            </span>
          )}
          {req.bathrooms_min && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {req.bathrooms_min}+ baños
            </span>
          )}
          {req.urgency && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {urgencyLabel(req.urgency)}
            </span>
          )}
        </div>

        {req.requirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {req.requirements.slice(0, 4).map((r) => (
              <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {r.replace(/_/g, ' ')}
              </span>
            ))}
            {req.requirements.length > 4 && (
              <span className="text-xs text-gray-400">+{req.requirements.length - 4} más</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {req.views_count} vistas
            </span>
            <span>{timeAgo(req.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
            <Lock className="h-3.5 w-3.5" />
            1 crédito
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function PedidosFeed() {
  const [requests, setRequests] = useState<PublicBuyerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({
    zone: '',
    type: '',
    financing: '',
    maxBudget: '',
  })

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filters.zone) params.set('zone', filters.zone)
    if (filters.type) params.set('type', filters.type)
    if (filters.financing) params.set('financing', filters.financing)
    if (filters.maxBudget) params.set('maxBudget', filters.maxBudget)

    const res = await fetch(`/api/pedidos?${params}`)
    const json = await res.json()
    setRequests(json.data || [])
    setTotalPages(json.totalPages || 1)
    setTotal(json.count || 0)
    setLoading(false)
  }, [page, filters])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  function handleFilterChange(key: string, value: string | null) {
    setFilters((f) => ({ ...f, [key]: !value || value === 'todos' ? '' : value }))
    setPage(1)
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
          {(filters.zone || filters.type || filters.financing || filters.maxBudget) && (
            <button
              onClick={() => setFilters({ zone: '', type: '', financing: '', maxBudget: '' })}
              className="ml-auto text-xs text-blue-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={filters.zone || 'todos'} onValueChange={(v) => handleFilterChange('zone', v)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las zonas</SelectItem>
              {ZONES_CORDOBA.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.type || 'todos'} onValueChange={(v) => handleFilterChange('type', v)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.financing || 'todos'} onValueChange={(v) => handleFilterChange('financing', v)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Financiación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cualquier financiación</SelectItem>
              {Object.entries(FINANCING_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.maxBudget || 'todos'} onValueChange={(v) => handleFilterChange('maxBudget', v)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Presupuesto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cualquier precio</SelectItem>
              <SelectItem value="100000">Hasta USD 100k</SelectItem>
              <SelectItem value="200000">Hasta USD 200k</SelectItem>
              <SelectItem value="350000">Hasta USD 350k</SelectItem>
              <SelectItem value="500000">Hasta USD 500k</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          {total} pedido{total !== 1 ? 's' : ''} activo{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Feed */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="flex gap-2">
                <div className="h-5 bg-gray-100 rounded-full w-16" />
                <div className="h-5 bg-gray-100 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium mb-2">No hay pedidos con esos filtros</p>
          <p className="text-sm">Probá con otros criterios o eliminá los filtros</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
