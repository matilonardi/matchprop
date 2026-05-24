import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createHmac, timingSafeEqual } from 'crypto'

function makeCloseToken(requestId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createHmac('sha256', secret).update(requestId).digest('hex').slice(0, 32)
}

function verifyCloseToken(requestId: string, token: string): boolean {
  const expected = makeCloseToken(requestId)
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params
  const body = await request.json()

  const {
    close_token,
    // Editable fields
    zones,
    property_types,
    budget_usd,
    financing,
    financing_types,
    bedrooms_min,
    bedrooms_max,
    bathrooms_min,
    description,
    urgency,
    requirements,
    requirements_excluyentes,
    priorities,
    // Car-specific
    car_brands,
    car_body_styles,
    car_year_min,
    car_year_max,
    car_condition,
    car_km_max,
    car_fuel_types,
    car_transmission,
    // Property dimensions
    area_cubierta_min,
    area_cubierta_max,
    area_terreno_min,
    area_terreno_max,
    cocheras_min,
    seguridad_tipos,
  } = body

  const supabase = createServerClient()

  // Verify ownership: either via close_token OR via authenticated session
  let authorized = false

  if (close_token) {
    authorized = verifyCloseToken(id, close_token)
  } else {
    // Check auth session
    const { data: { user } } = await supabase.auth.getUser(
      request.headers.get('authorization')?.replace('Bearer ', '') || ''
    )
    if (user) {
      // Verify this user owns the request
      const { data: req } = await supabase
        .from('buyer_requests')
        .select('buyer_user_id')
        .eq('id', id)
        .single()
      authorized = req?.buyer_user_id === user.id
    }
  }

  if (!authorized) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Build update object with only provided fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (zones !== undefined) updates.zones = zones
  if (property_types !== undefined) updates.property_types = property_types
  if (budget_usd !== undefined) updates.budget_usd = budget_usd
  if (financing !== undefined) updates.financing = financing
  if (financing_types !== undefined) updates.financing_types = financing_types
  if (bedrooms_min !== undefined) updates.bedrooms_min = bedrooms_min || null
  if (bedrooms_max !== undefined) updates.bedrooms_max = bedrooms_max || null
  if (bathrooms_min !== undefined) updates.bathrooms_min = bathrooms_min || null
  if (description !== undefined) updates.description = description || null
  if (urgency !== undefined) updates.urgency = urgency || null
  if (requirements !== undefined) updates.requirements = requirements
  if (requirements_excluyentes !== undefined) updates.requirements_excluyentes = requirements_excluyentes
  if (priorities !== undefined) updates.priorities = priorities
  // Car-specific
  if (car_brands !== undefined) updates.car_brands = car_brands
  if (car_body_styles !== undefined) updates.car_body_styles = car_body_styles
  if (car_year_min !== undefined) updates.car_year_min = car_year_min || null
  if (car_year_max !== undefined) updates.car_year_max = car_year_max || null
  if (car_condition !== undefined) updates.car_condition = car_condition || null
  if (car_km_max !== undefined) updates.car_km_max = car_km_max || null
  if (car_fuel_types !== undefined) updates.car_fuel_types = car_fuel_types
  if (car_transmission !== undefined) updates.car_transmission = car_transmission || null
  // Property dimensions
  if (area_cubierta_min !== undefined) updates.area_cubierta_min = area_cubierta_min || null
  if (area_cubierta_max !== undefined) updates.area_cubierta_max = area_cubierta_max || null
  if (area_terreno_min !== undefined) updates.area_terreno_min = area_terreno_min || null
  if (area_terreno_max !== undefined) updates.area_terreno_max = area_terreno_max || null
  if (cocheras_min !== undefined) updates.cocheras_min = cocheras_min || null
  if (seguridad_tipos !== undefined) updates.seguridad_tipos = seguridad_tipos

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const { error } = await supabase
    .from('buyer_requests')
    .update(updates)
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
