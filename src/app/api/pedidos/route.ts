import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const zone = searchParams.get('zone')
  const type = searchParams.get('type')
  const financing = searchParams.get('financing')
  const maxBudget = searchParams.get('maxBudget')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const supabase = createServerClient()

  let query = supabase
    .from('buyer_requests')
    .select(
      'id, property_types, zones, bedrooms_min, bedrooms_max, bathrooms_min, budget_usd, financing, requirements, description, urgency, status, views_count, leads_count, created_at',
      { count: 'exact' }
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (zone) query = query.contains('zones', [zone])
  if (type) query = query.contains('property_types', [type])
  if (financing && financing !== 'todos') query = query.eq('financing', financing)
  if (maxBudget) query = query.lte('budget_usd', parseInt(maxBudget))

  const { data, error, count } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Increment views is handled client-side on detail page
  return Response.json({ data, count, page, totalPages: Math.ceil((count || 0) / limit) })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    property_types,
    zones,
    bedrooms_min,
    bedrooms_max,
    bathrooms_min,
    budget_usd,
    financing,
    requirements,
    description,
    urgency,
    contact_name,
    contact_phone,
    contact_email,
  } = body

  if (!property_types?.length || !zones?.length || !budget_usd || !financing || !contact_name || !contact_phone) {
    return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('buyer_requests')
    .insert({
      property_types,
      zones,
      bedrooms_min: bedrooms_min || null,
      bedrooms_max: bedrooms_max || null,
      bathrooms_min: bathrooms_min || null,
      budget_usd,
      financing,
      requirements: requirements || [],
      description: description || null,
      urgency: urgency || null,
      contact_name,
      contact_phone,
      contact_email: contact_email || null,
    })
    .select('id')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Trigger AI matching in background (non-blocking)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${appUrl}/api/matching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: data.id }),
    }).catch(() => {})
  } catch {}

  return Response.json({ id: data.id }, { status: 201 })
}
