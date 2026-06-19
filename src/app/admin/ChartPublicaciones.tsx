'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

type DataPoint = { date: string; count: number }

const RANGES = [
  { label: '7 días',   days: 7  },
  { label: '30 días',  days: 30 },
  { label: '3 meses',  days: 90 },
]

function formatDate(dateStr: string, days: number) {
  const [, month, day] = dateStr.split('-')
  if (days <= 7) return `${day}/${month}`
  if (days <= 30) return `${day}/${month}`
  return `${day}/${month}`
}

export default function ChartPublicaciones() {
  const [days, setDays]   = useState(30)
  const [data, setData]   = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/daily?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [days])

  const total = data.reduce((s, d) => s + d.count, 0)
  const max   = Math.max(...data.map(d => d.count), 1)

  // Para 90 días mostrar solo 1 de cada 3 labels en el eje X
  const tickFormatter = (val: string) => {
    if (days === 90) {
      const idx = data.findIndex(d => d.date === val)
      return idx % 3 === 0 ? formatDate(val, days) : ''
    }
    return formatDate(val, days)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Publicaciones por día</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} publicaciones en los últimos {days} días
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
