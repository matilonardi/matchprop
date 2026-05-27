'use client'

import { CreditCard, Unlock, MapPin, Home, Car, Phone, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ── Broker shape ─────────────────────────────────────────────
interface EnrichedBroker {
  id: string
  name: string
  agency_name?: string | null
  email: string
  phone?: string | null
  zones: string[]
  credits: number           // credits remaining
  credits_spent: number     // credits used (= leads unlocked)
  credits_total: number     // total ever acquired
  leads_unlocked: number
  revenue_estimate: number  // ≈ USD (credits_total × $4)
  created_at: string
}

// ── Buyer shape ───────────────────────────────────────────────
interface EnrichedBuyer {
  id: string
  user_id: string
  name: string
  phone?: string | null
  created_at: string
  total: number     // total requests published
  property: number  // property requests
  car: number       // car requests
}

type AdminUsersTableProps =
  | { type: 'broker'; users: EnrichedBroker[]; adminSecret: string }
  | { type: 'buyer'; users: EnrichedBuyer[]; adminSecret: string }

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function CreditBar({ spent, remaining }: { spent: number; remaining: number }) {
  const total = spent + remaining
  if (total === 0) return <span className="text-gray-400 text-xs">Sin actividad</span>
  const pct = Math.round((spent / total) * 100)
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{pct}%</span>
    </div>
  )
}

export default function AdminUsersTable({ type, users }: AdminUsersTableProps) {
  if (type === 'broker') {
    const brokers = users as EnrichedBroker[]
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Brokers registrados ({brokers.length})
          </h2>
          <p className="text-xs text-gray-400">Revenue estimado a ~$20.000 ARS / crédito</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">Broker</th>
                <th className="text-left px-4 py-3 font-medium">Registro</th>
                <th className="text-left px-4 py-3 font-medium">Créditos</th>
                <th className="text-left px-4 py-3 font-medium">Uso</th>
                <th className="text-left px-4 py-3 font-medium">Leads</th>
                <th className="text-left px-4 py-3 font-medium">Revenue ~</th>
                <th className="text-left px-4 py-3 font-medium">Zonas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brokers.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  {/* Identity */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.name}</div>
                    {b.agency_name && (
                      <div className="text-xs text-gray-400">{b.agency_name}</div>
                    )}
                    <div className="text-xs text-blue-500">{b.email}</div>
                    {b.phone && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />{b.phone}
                      </div>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(b.created_at)}
                    </div>
                  </td>

                  {/* Credits */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-base font-bold text-orange-500">{b.credits}</div>
                        <div className="text-[10px] text-gray-400">disponibles</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-bold text-gray-400">{b.credits_spent}</div>
                        <div className="text-[10px] text-gray-400">gastados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-bold text-blue-600">{b.credits_total}</div>
                        <div className="text-[10px] text-gray-400">total</div>
                      </div>
                    </div>
                  </td>

                  {/* Usage bar */}
                  <td className="px-4 py-3">
                    <CreditBar spent={b.credits_spent} remaining={b.credits} />
                  </td>

                  {/* Leads unlocked */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-green-700 font-medium">
                      <Unlock className="h-3.5 w-3.5 text-green-500" />
                      {b.leads_unlocked}
                    </div>
                  </td>

                  {/* Revenue estimate */}
                  <td className="px-4 py-3">
                    {b.revenue_estimate > 0 ? (
                      <span className="font-semibold text-emerald-600">
                        ~${b.revenue_estimate.toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">$0</span>
                    )}
                  </td>

                  {/* Zones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 text-orange-400 flex-shrink-0" />
                      <span>
                        {(b.zones || []).slice(0, 2).join(', ')}
                        {(b.zones || []).length > 2 && (
                          <span className="ml-1 text-gray-400">+{b.zones.length - 2}</span>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {brokers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No hay brokers registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {brokers.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-orange-500" />
              Créditos totales vendidos:{' '}
              <strong className="text-gray-700">
                {brokers.reduce((s, b) => s + b.credits_total, 0)}
              </strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Unlock className="h-3.5 w-3.5 text-green-500" />
              Leads desbloqueados:{' '}
              <strong className="text-gray-700">
                {brokers.reduce((s, b) => s + b.leads_unlocked, 0)}
              </strong>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              Revenue total: ~${brokers.reduce((s, b) => s + b.revenue_estimate, 0).toLocaleString('es-AR')} ARS
            </span>
          </div>
        )}
      </div>
    )
  }

  // ── Buyers table ─────────────────────────────────────────────
  const buyers = users as EnrichedBuyer[]
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">
          Compradores registrados ({buyers.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium">Comprador</th>
              <th className="text-left px-4 py-3 font-medium">Registro</th>
              <th className="text-left px-4 py-3 font-medium">Publicaciones</th>
              <th className="text-left px-4 py-3 font-medium">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {buyers.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                {/* Identity */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{b.name || '—'}</div>
                  {b.phone && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />{b.phone}
                    </div>
                  )}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(b.created_at)}
                  </div>
                </td>

                {/* Total requests */}
                <td className="px-4 py-3">
                  {b.total > 0 ? (
                    <span className="font-bold text-gray-900">{b.total}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                  <span className="text-xs text-gray-400 ml-1">
                    publicación{b.total !== 1 ? 'es' : ''}
                  </span>
                </td>

                {/* Request types */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {b.property > 0 && (
                      <Badge className="bg-orange-100 text-orange-700 border-0 gap-1 text-xs py-0.5">
                        <Home className="h-3 w-3" />
                        {b.property} prop.
                      </Badge>
                    )}
                    {b.car > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 gap-1 text-xs py-0.5">
                        <Car className="h-3 w-3" />
                        {b.car} auto{b.car !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {b.total === 0 && (
                      <span className="text-xs text-gray-400">Sin publicaciones</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {buyers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">
                  No hay compradores registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      {buyers.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-orange-500" />
            Búsquedas de propiedades:{' '}
            <strong className="text-gray-700">
              {buyers.reduce((s, b) => s + b.property, 0)}
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-blue-500" />
            Búsquedas de autos:{' '}
            <strong className="text-gray-700">
              {buyers.reduce((s, b) => s + b.car, 0)}
            </strong>
          </span>
        </div>
      )}
    </div>
  )
}
