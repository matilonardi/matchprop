import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('matchprop_admin')?.value
  const secret  = process.env.ADMIN_SECRET
  if (!secret || session !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params   = req.nextUrl.searchParams
  const days     = parseInt(params.get('days')     || '30')
  const types    = params.get('types')?.split(',').filter(Boolean) || []
  const zone     = params.get('zone')  || ''
  const minPrice = parseInt(params.get('minPrice') || '0')
  const maxPrice = parseInt(params.get('maxPrice') || '0')

  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()

  const supabase = createServerClient()
  let query = supabase
    .from('buyer_requests')
    .select('created_at, property_types, zones, budget_usd')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (minPrice > 0) query = query.gte('budget_usd', minPrice)
  if (maxPrice > 0) query = query.lte('budget_usd', maxPrice)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtros que no soporta Supabase directamente (arrays)
  const filtered = (data || []).filter(row => {
    if (types.length > 0 && !types.some(t => (row.property_types || []).includes(t))) return false
    if (zone && !(row.zones || []).includes(zone)) return false
    return true
  })

  // Agrupar por fecha local (UTC-3 Córdoba)
  const counts: Record<string, number> = {}
  for (const row of filtered) {
    const d = new Date(row.created_at)
    d.setHours(d.getHours() - 3)
    const key = d.toISOString().slice(0, 10)
    counts[key] = (counts[key] || 0) + 1
  }

  // Rellenar días sin publicaciones con 0
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000)
    d.setHours(d.getHours() - 3)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, count: counts[key] || 0 })
  }

  return NextResponse.json(result)
}
