'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

const PROPERTY_LABELS: Record<string, string> = {
  casa: 'Casa', departamento: 'Depto', duplex: 'Dúplex/PH', ph: 'PH',
  terreno: 'Terreno', local: 'Local', renta: 'Renta', revaluo: 'Revalúo',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function escape(v: unknown): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  return [
    keys.join(','),
    ...rows.map(r => keys.map(k => escape(r[k])).join(',')),
  ].join('\n')
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function thirtyDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

interface Row {
  id: string
  created_at: string
  property_types: string[]
  zones: string[]
  bedrooms_min: number | null
  bedrooms_max: number | null
  contact_phone: string
  budget_usd: number
  financing_types: string[] | null
  description: string | null
  operation_type: string | null
}

export default function AdminExportButton() {
  const [from, setFrom] = useState(thirtyDaysAgo())
  const [to, setTo]     = useState(todayStr())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ from, to })
      const res = await fetch(`/api/admin/export?${params}`)
      if (!res.ok) throw new Error('Error al obtener datos')
      const { rows } = await res.json() as { rows: Row[] }

      if (!rows.length) {
        setError('No hay pedidos en ese rango de fechas.')
        return
      }

      const mapped = rows.map(r => {
        const types = (r.property_types || []).map(t => PROPERTY_LABELS[t] || t).join(' / ')
        const beds = r.bedrooms_min
          ? r.bedrooms_max && r.bedrooms_max !== r.bedrooms_min
            ? `${r.bedrooms_min}-${r.bedrooms_max} dorm.`
            : `${r.bedrooms_min}+ dorm.`
          : ''
        const pedido = [types, beds].filter(Boolean).join(' · ')
        const zones = (r.zones || []).join(' / ')
        const entregaMenor = (r.financing_types || []).includes('credito') ? 'Sí' : 'No'

        const operacion = r.operation_type === 'alquiler' ? 'Alquiler' : r.operation_type === 'compra' ? 'Venta' : ''

        return {
          'Código': r.id.slice(0, 8).toUpperCase(),
          'Fecha': fmtDate(r.created_at),
          'Operación': operacion,
          'Pedido': pedido,
          'Teléfono': r.contact_phone || '',
          'Zona': zones,
          'Barrio': zones,
          'Precio USD': r.budget_usd || '',
          'Entrega menor': entregaMenor,
        }
      })

      // BOM for Excel UTF-8
      const csv = '﻿' + toCsv(mapped)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pedidos_${from}_${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={loading || !from || !to}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Descargar Excel
      </button>

      {error && <p className="text-xs text-red-500 w-full">{error}</p>}
    </div>
  )
}
