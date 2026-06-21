'use client'

import { useState } from 'react'

const REASON_LABELS: Record<string, string> = {
  vendida: 'Propiedad ya vendida / alquilada',
  contacto_incorrecto: 'Datos de contacto incorrectos',
  falso: 'Búsqueda falsa o spam',
  cliente_encontro: 'Cliente ya encontró lo que buscaba',
  otro: 'Otro',
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  reviewed: { label: 'Revisado', cls: 'bg-green-100 text-green-700' },
  dismissed: { label: 'Desestimado', cls: 'bg-gray-100 text-gray-500' },
}

type Report = {
  id: string
  request_id: string
  broker_id: string | null
  reason: string
  status: string
  created_at: string
}
type Broker = { id: string; name: string; agency_name: string }
type Request = { id: string; contact_name: string; zones: string[] }

export default function ReportsTab({
  reports,
  brokers,
  requests,
  adminSecret,
}: {
  reports: Report[]
  brokers: Broker[]
  requests: Request[]
  adminSecret: string
}) {
  const [localReports, setLocalReports] = useState(reports)
  const [loading, setLoading] = useState<string | null>(null)

  async function act(reportId: string, action: 'dismiss' | 'close_request') {
    setLoading(reportId + action)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ report_id: reportId, action }),
      })
      if (!res.ok) return
      setLocalReports(prev =>
        prev.map(r => {
          if (r.id !== reportId) return r
          if (action === 'dismiss') return { ...r, status: 'dismissed' }
          // close_request marks all reports for that request as reviewed
          if (action === 'close_request') return { ...r, status: 'reviewed' }
          return r
        })
      )
    } finally {
      setLoading(null)
    }
  }

  const brokerMap = Object.fromEntries(brokers.map(b => [b.id, b]))
  const requestMap = Object.fromEntries(requests.map(r => [r.id, r]))

  const pending = localReports.filter(r => r.status === 'pending')
  const done = localReports.filter(r => r.status !== 'pending')

  function ReportRow({ r }: { r: Report }) {
    const broker = r.broker_id ? brokerMap[r.broker_id] : null
    const req = requestMap[r.request_id]
    const st = STATUS_LABELS[r.status] || STATUS_LABELS.pending

    return (
      <tr className="hover:bg-gray-50 border-t border-gray-100">
        <td className="px-4 py-3">
          {req ? (
            <a href={`/pedidos/${r.request_id}`} target="_blank" className="text-orange-600 hover:underline font-medium text-sm">
              {req.contact_name || 'Sin nombre'}
            </a>
          ) : (
            <span className="text-xs text-gray-400 font-mono">{r.request_id.slice(0, 8)}</span>
          )}
          {req && (
            <p className="text-xs text-gray-400 mt-0.5">{(req.zones || []).slice(0, 2).join(', ')}</p>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {REASON_LABELS[r.reason] || r.reason}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {broker?.name || broker?.agency_name || '—'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(r.created_at).toLocaleDateString('es-AR')}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
        </td>
        <td className="px-4 py-3">
          {r.status === 'pending' && (
            <div className="flex gap-2">
              <button
                disabled={!!loading}
                onClick={() => act(r.id, 'close_request')}
                className="text-xs px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading === r.id + 'close_request' ? '…' : 'Bajar pedido'}
              </button>
              <button
                disabled={!!loading}
                onClick={() => act(r.id, 'dismiss')}
                className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading === r.id + 'dismiss' ? '…' : 'Desestimar'}
              </button>
            </div>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            Reportes pendientes
            {pending.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {pending.length}
              </span>
            )}
          </h2>
        </div>
        {pending.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No hay reportes pendientes. 🎉
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pedido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Motivo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Broker</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pending.map(r => <ReportRow key={r.id} r={r} />)}
            </tbody>
          </table>
        )}
      </div>

      {done.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Historial</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pedido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Motivo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Broker</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {done.map(r => <ReportRow key={r.id} r={r} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
