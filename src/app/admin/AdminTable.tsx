'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink, Car, Home } from 'lucide-react'

interface BuyerRequest {
  id: string
  request_type: string | null
  publisher_type: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  zones: string[] | null
  budget_usd: number | null
  status: string | null
  views_count: number | null
  created_at: string
}

interface AdminTableProps {
  requests: BuyerRequest[]
  adminSecret: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function ZonesBadge({ zones }: { zones: string[] | null }) {
  if (!zones || zones.length === 0) return <span className="text-gray-400">—</span>
  const visible = zones.slice(0, 2)
  const extra = zones.length - 2
  return (
    <span className="text-xs text-gray-600">
      {visible.join(', ')}
      {extra > 0 && (
        <span className="ml-1 bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 text-[10px]">
          +{extra}
        </span>
      )}
    </span>
  )
}

export default function AdminTable({ requests: initialRequests, adminSecret }: AdminTableProps) {
  const [requests, setRequests] = useState<BuyerRequest[]>(initialRequests)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return

    setDeletingId(id)
    setError(null)

    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminSecret,
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }

      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Pedidos de compradores ({requests.length})
        </h2>
        {error && (
          <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">{error}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium">Fecha</th>
              <th className="text-left px-4 py-3 font-medium">Tipo</th>
              <th className="text-left px-4 py-3 font-medium">Origen</th>
              <th className="text-left px-4 py-3 font-medium">Contacto</th>
              <th className="text-left px-4 py-3 font-medium">Zonas</th>
              <th className="text-left px-4 py-3 font-medium">Presupuesto</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Vistas</th>
              <th className="text-left px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                {/* Date */}
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(r.created_at)}
                </td>

                {/* Type badge */}
                <td className="px-4 py-3">
                  {r.request_type === 'car' ? (
                    <Badge className="bg-blue-100 text-blue-700 border-0 gap-1 text-xs">
                      <Car className="h-3 w-3" />
                      Auto
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-700 border-0 gap-1 text-xs">
                      <Home className="h-3 w-3" />
                      Propiedad
                    </Badge>
                  )}
                </td>

                {/* Origin */}
                <td className="px-4 py-3">
                  {r.publisher_type === 'inmobiliaria' ? (
                    <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">Inmo</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Particular</Badge>
                  )}
                </td>

                {/* Contact */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">
                    {r.contact_name || '—'}
                  </div>
                  {r.contact_email && (
                    <div className="text-xs text-gray-400">{r.contact_email}</div>
                  )}
                  {r.contact_phone && (
                    <div className="text-xs text-gray-500">{r.contact_phone}</div>
                  )}
                </td>

                {/* Zones */}
                <td className="px-4 py-3">
                  <ZonesBadge zones={r.zones} />
                </td>

                {/* Budget */}
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                  {r.budget_usd === 999999 || r.budget_usd === null
                    ? 'Sin límite'
                    : `USD ${r.budget_usd.toLocaleString('es-AR')}`}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {r.status === 'active' ? (
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                      Activa
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                      {r.status === 'closed' ? 'Cerrada' : r.status || 'Inactiva'}
                    </Badge>
                  )}
                </td>

                {/* Views */}
                <td className="px-4 py-3 text-gray-600 text-center">
                  {r.views_count ?? 0}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/pedidos/${r.id}`} target="_blank">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-gray-600 hover:text-gray-900"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingId === r.id ? '...' : 'Eliminar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {requests.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                  No hay pedidos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
