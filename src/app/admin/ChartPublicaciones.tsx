'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

type DataPoint = { date: string; count: number }

const RANGES = [
  { label: '7 días',  days: 7  },
  { label: '30 días', days: 30 },
  { label: '3 meses', days: 90 },
]

const PROPERTY_TYPES = [
  { id: 'casa',         label: 'Casa' },
  { id: 'departamento', label: 'Depto' },
  { id: 'duplex',       label: 'Dúplex' },
  { id: 'ph',           label: 'PH' },
  { id: 'terreno',      label: 'Terreno' },
  { id: 'local',        label: 'Local' },
  { id: 'renta',        label: 'Renta' },
]

interface Props {
  topZones: string[]
}

export default function ChartPublicaciones({ topZones }: Props) {
  const [days, setDays]         = useState(30)
  const [types, setTypes]       = useState<string[]>([])
  const [zone, setZone]         = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [data, setData]         = useState<DataPoint[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ days: String(days) })
    if (types.length)  params.set('types',    types.join(','))
    if (zone)          params.set('zone',      zone)
    if (minPrice)      params.set('minPrice',  minPrice)
    if (maxPrice)      params.set('maxPrice',  maxPrice)

    fetch(`/api/admin/stats/daily?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [days, types, zone, minPrice, maxPrice])

  const total = data.reduce((s, d) => s + d.count, 0)
  const max   = Math.max(...data.map(d => d.count), 1)

  function toggleType(id: string) {
    setTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const hasFilters = types.length > 0 || zone || minPrice || maxPrice

  const tickFormatter = (val: string) => {
    const [, month, day] = val.split('-')
    if (days === 90) {
      const idx = data.findIndex(d => d.date === val)
      return idx % 3 === 0 ? `${day}/${month}` : ''
    }
    return `${day}/${month}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Publicaciones por día</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} publicaciones en los últimos {days} días
            {hasFilters && <span className="ml-1 text-orange-500">· filtrado</span>}
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                days === r.days
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 pb-3 border-b border-gray-50">
        {/* Tipo de propiedad */}
        <div className="flex flex-wrap gap-1">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => toggleType(t.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                types.includes(t.id)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Zona */}
        <select
          value={zone}
          onChange={e => setZone(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-400"
        >
          <option value="">Todas las zonas</option>
          {topZones.map(z => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>

        {/* Rango de precio */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">USD</span>
          <input
            type="number"
            placeholder="Desde"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <span className="text-xs text-gray-300">—</span>
          <input
            type="number"
            placeholder="Hasta"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        {/* Limpiar filtros */}
        {hasFilters && (
          <button
            onClick={() => { setTypes([]); setZone(''); setMinPrice(''); setMaxPrice('') }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Gráfico */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          Cargando...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              domain={[0, max + 1]}
            />
            <Tooltip
              cursor={{ fill: '#fff7ed' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as DataPoint
                const [year, month, day] = d.date.split('-')
                return (
                  <div className="bg-white border border-gray-100 rounded-lg shadow px-3 py-2 text-xs">
                    <div className="font-semibold text-gray-700">{`${day}/${month}/${year}`}</div>
                    <div className="text-orange-500 font-bold">{d.count} publicaciones</div>
                  </div>
                )
              }}
            />
            <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
