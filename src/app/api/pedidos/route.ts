import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createHmac } from 'crypto'
import { Resend } from 'resend'

function makeCloseToken(requestId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createHmac('sha256', secret).update(requestId).digest('hex').slice(0, 32)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const zonesParam = searchParams.get('zones') // comma-separated multi-zone
  const zones = zonesParam ? zonesParam.split(',').filter(Boolean) : []
  const typesParam = searchParams.get('types') // comma-separated: "casa,departamento"
  const types = typesParam ? typesParam.split(',').filter(Boolean) : []
  const financing = searchParams.get('financing')
  const minBudget = searchParams.get('minBudget')
  const maxBudget = searchParams.get('maxBudget')
  const since = searchParams.get('since') // '24h' | '7d' | '30d'
  const dateFrom = searchParams.get('dateFrom') // 'YYYY-MM-DD'
  const dateTo = searchParams.get('dateTo')     // 'YYYY-MM-DD'
  const sort = searchParams.get('sort') || 'recent' // 'recent' | 'oldest' | 'budget_asc' | 'budget_desc'
  const requestType = searchParams.get('requestType') // 'property' | 'car'
  const condition = searchParams.get('condition') // car condition filter
  const carBrandsParam = searchParams.get('carBrands')
  const carBrands = carBrandsParam ? carBrandsParam.split(',').filter(Boolean) : []
  const carTransmission = searchParams.get('carTransmission')
  const carFuelsParam = searchParams.get('carFuels')
  const carFuels = carFuelsParam ? carFuelsParam.split(',').filter(Boolean) : []
  const carKmMax = searchParams.get('carKmMax')
  const publisherType = searchParams.get('publisherType') // 'particular' | 'inmobiliaria'
  const bedroomsMinParam = searchParams.get('bedroomsMin')
  const bedroomsMin = bedroomsMinParam ? bedroomsMinParam.split(',').filter(Boolean) : []
  const page = parseInt(searchParams.get('page') || '1')
  const q    = searchParams.get('q')?.trim() || ''   // free-text search
  const limit = 20

  const supabase = createServerClient()

  let query = supabase
    .from('buyer_requests')
    .select(
      'id, request_type, property_types, zones, bedrooms_min, bedrooms_max, bathrooms_min, budget_usd, financing, financing_types, financing_cash_pct, financing_bank, financing_precalified, search_reason, requirements, requirements_excluyentes, priorities, description, urgency, status, views_count, leads_count, created_at, car_brands, car_body_styles, car_year_min, car_year_max, car_condition, car_km_max, car_fuel_types, car_transmission, publisher_type, agency_name',
      { count: 'exact' }
    )
    .eq('status', 'active')
    .range((page - 1) * limit, page * limit - 1)

  // Sorting
  if (sort === 'oldest')      query = query.order('created_at', { ascending: true })
  else if (sort === 'budget_asc')  query = query.order('budget_usd', { ascending: true })
  else if (sort === 'budget_desc') query = query.order('budget_usd', { ascending: false })
  else                        query = query.order('created_at', { ascending: false })

  if (requestType) query = query.eq('request_type', requestType)
  else query = query.eq('request_type', 'property') // default to property tab

  // Multi-zone: match any request whose zones array overlaps the selected zones
  if (zones.length === 1) query = query.contains('zones', [zones[0]])
  else if (zones.length > 1) query = query.overlaps('zones', zones)
  if (types.length && requestType !== 'car') query = query.overlaps('property_types', types)
  if (condition && requestType === 'car') query = query.eq('car_condition', condition)
  if (carBrands.length && requestType === 'car') query = query.overlaps('car_brands', carBrands)
  if (carTransmission && requestType === 'car') query = query.eq('car_transmission', carTransmission)
  if (carFuels.length && requestType === 'car') query = query.overlaps('car_fuel_types', carFuels)
  if (carKmMax && requestType === 'car') query = query.lte('car_km_max', parseInt(carKmMax))
  if (publisherType) query = query.eq('publisher_type', publisherType)
  if (since) {
    const sinceMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 }
    const days = sinceMap[since]
    if (days) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', cutoff)
    }
  }
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z')
  if (financing && financing !== 'todos' && requestType !== 'car') {
    const newTypes = ['efectivo', 'credito', 'permuta_propiedad', 'permuta_auto']
    if (newTypes.includes(financing)) {
      query = query.contains('financing_types', [financing])
    } else {
      query = query.eq('financing', financing)
    }
  }
  if (bedroomsMin.length && requestType !== 'car') query = query.in('bedrooms_min', bedroomsMin.map(Number))
  if (minBudget) query = query.gte('budget_usd', parseInt(minBudget))
  if (maxBudget) query = query.lte('budget_usd', parseInt(maxBudget))
  if (q) query = query.or(`description.ilike.%${q}%,search_reason.ilike.%${q}%`)

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
    request_type,
    property_types,
    zones,
    bedrooms_min,
    bedrooms_max,
    bathrooms_min,
    budget_usd,
    financing,
    requirements,
    requirements_excluyentes,
    priorities,
    financing_types,
    financing_cash_pct,
    financing_bank,
    financing_precalified,
    search_reason,
    description,
    urgency,
    contact_name,
    contact_phone,
    contact_email,
    // Car-specific
    car_brands,
    car_body_styles,
    car_year_min,
    car_year_max,
    car_condition,
    car_km_max,
    car_fuel_types,
    car_transmission,
  } = body

  const isCarRequest = request_type === 'car'

  if (!zones?.length || !budget_usd || !financing || !contact_name || !contact_phone) {
    return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }
  if (!isCarRequest && !property_types?.length) {
    return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('buyer_requests')
    .insert({
      request_type: request_type || 'property',
      property_types: property_types || [],
      zones,
      bedrooms_min: bedrooms_min || null,
      bedrooms_max: bedrooms_max || null,
      bathrooms_min: bathrooms_min || null,
      budget_usd,
      financing,
      requirements: requirements || [],
      requirements_excluyentes: requirements_excluyentes || [],
      priorities: priorities || [],
      financing_types: financing_types || [],
      financing_cash_pct: financing_cash_pct || null,
      financing_bank: financing_bank || null,
      financing_precalified: financing_precalified ?? null,
      search_reason: search_reason || null,
      description: description || null,
      urgency: urgency || null,
      contact_name,
      contact_phone,
      contact_email: contact_email || null,
      // Car-specific
      car_brands: car_brands || [],
      car_body_styles: car_body_styles || [],
      car_year_min: car_year_min || null,
      car_year_max: car_year_max || null,
      car_condition: car_condition || null,
      car_km_max: car_km_max || null,
      car_fuel_types: car_fuel_types || [],
      car_transmission: car_transmission || null,
    })
    .select('id')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Trigger AI matching in background (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    fetch(`${appUrl}/api/matching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: data.id }),
    }).catch(() => {})
  } catch {}

  // Admin notification (non-blocking)
  const adminEmail = process.env.ADMIN_EMAIL || ''
  const adminSecret = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  if (adminEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY || '')
      const isCarReq = request_type === 'car'
      const budgetLabel = budget_usd && budget_usd > 0
        ? `USD ${Number(budget_usd).toLocaleString('es-AR')}`
        : 'A convenir'
      resend.emails.send({
        from: 'Propi <alertas@matchprop.com.ar>',
        to: adminEmail,
        subject: `${isCarReq ? '🚗' : '🏠'} Nueva búsqueda: ${contact_name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2937;">
            <h2 style="color:#2563eb;">Nueva búsqueda publicada</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#6b7280;width:130px;">Tipo</td><td>${isCarReq ? 'Vehículo 🚗' : 'Propiedad 🏠'}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Contacto</td><td><strong>${contact_name}</strong></td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Teléfono</td><td>${contact_phone}</td></tr>
              ${contact_email ? `<tr><td style="padding:6px 0;color:#6b7280;">Email</td><td>${contact_email}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#6b7280;">Zonas</td><td>${(zones as string[]).join(', ')}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Presupuesto</td><td>${budgetLabel}</td></tr>
              ${description ? `<tr><td style="padding:6px 0;color:#6b7280;">Detalle</td><td>${description}</td></tr>` : ''}
            </table>
            <div style="margin-top:16px;display:flex;gap:12px;">
              <a href="${appUrl}/pedidos/${data.id}"
                 style="background:#f97316;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">
                Ver pedido →
              </a>
              <a href="${appUrl}/admin?key=${adminSecret}&tab=requests"
                 style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">
                Admin →
              </a>
            </div>
          </div>
        `,
      }).catch(() => {})
    } catch {}
  }

  const close_token = makeCloseToken(data.id)
  return Response.json({ id: data.id, close_token }, { status: 201 })
}
