import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  const cookieStore = await cookies()
  const session = cookieStore.get('matchprop_admin')?.value
  if (session !== ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')

  const supabase = createServerClient()

  let query = supabase
    .from('buyer_requests')
    .select('id, created_at, property_types, zones, bedrooms_min, bedrooms_max, contact_phone, budget_usd, financing_types, description, status, operation_type')
    .order('created_at', { ascending: false })

  if (from) query = query.gte('created_at', new Date(from).toISOString())
  if (to) {
    // Include the full "to" day
    const toDate = new Date(to)
    toDate.setDate(toDate.getDate() + 1)
    query = query.lt('created_at', toDate.toISOString())
  }

  const { data, error } = await query

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ rows: data ?? [] })
}
