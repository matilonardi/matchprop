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

  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('buyer_requests')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrupar por fecha local (UTC-3 Córdoba)
  const counts: Record<string, number> = {}
  for (const row of data || []) {
    const d = new Date(row.created_at)
    // Ajustar a UTC-3
    d.setHours(d.getHours() - 3)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
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
