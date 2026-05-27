import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createHmac } from 'crypto'

function makeCloseToken(requestId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createHmac('sha256', secret).update(requestId).digest('hex').slice(0, 32)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    // Auth fields
    email,
    password,
    name,
    phone,
    captcha_token,
    // Request fields
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
    // Property dimensions
    area_cubierta_min,
    area_cubierta_max,
    area_terreno_min,
    area_terreno_max,
    terreno_frente_min,
    terreno_frente_max,
    terreno_fondo_min,
    terreno_fondo_max,
    cocheras_min,
    seguridad_tipos,
    publisher_type,
    agency_name,
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

  // Validate required fields
  if (!email?.trim() || !password || !name?.trim() || !phone?.trim()) {
    return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }
  if (!zones?.length || !budget_usd || !financing) {
    return Response.json({ error: 'Datos de la búsqueda incompletos' }, { status: 400 })
  }

  // Verify hCaptcha token (skip on localhost, if no secret, or if widget failed gracefully)
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET
  const isLocalhost = (process.env.NEXT_PUBLIC_APP_URL || '').includes('localhost')
  if (hcaptchaSecret && !isLocalhost && captcha_token) {
    const verify = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: hcaptchaSecret, response: captcha_token }),
    }).then(r => r.json()).catch(() => ({ success: true })) // soft-fail on network error
    if (!verify.success) {
      console.warn('[hcaptcha] verification failed — proceeding anyway (MVP mode)')
    }
  }

  const supabase = createServerClient()

  // 1. Create Supabase auth user (service role → skip email confirmation)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), phone: phone.trim(), role: 'buyer' },
  })

  if (authError) {
    const msg = authError.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return Response.json(
        { error: 'Ya existe una cuenta con ese email. Iniciá sesión desde /comprador/login.' },
        { status: 409 }
      )
    }
    return Response.json({ error: authError.message }, { status: 500 })
  }

  const userId = authData.user.id

  // 2. Create buyer_profile
  const { error: profileError } = await supabase.from('buyer_profiles').insert({
    user_id: userId,
    name: name.trim(),
    phone: phone.trim(),
  })

  if (profileError) {
    // Non-fatal — continue
    console.error('buyer_profile insert error:', profileError.message)
  }

  // 3. Create buyer_request linked to the new user
  const { data: reqData, error: reqError } = await supabase
    .from('buyer_requests')
    .insert({
      buyer_user_id: userId,
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
      contact_name: name.trim(),
      contact_phone: phone.trim(),
      contact_email: email.trim().toLowerCase(),
      // Property dimensions
      area_cubierta_min: area_cubierta_min || null,
      area_cubierta_max: area_cubierta_max || null,
      area_terreno_min: area_terreno_min || null,
      area_terreno_max: area_terreno_max || null,
      terreno_frente_min: terreno_frente_min || null,
      terreno_frente_max: terreno_frente_max || null,
      terreno_fondo_min: terreno_fondo_min || null,
      terreno_fondo_max: terreno_fondo_max || null,
      cocheras_min: cocheras_min || null,
      seguridad_tipos: seguridad_tipos || [],
      publisher_type: publisher_type || 'particular',
      agency_name: agency_name || null,
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

  if (reqError) {
    return Response.json({ error: reqError.message }, { status: 500 })
  }

  // Trigger AI matching in background
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${appUrl}/api/matching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: reqData.id }),
    }).catch(() => {})
  } catch {}

  const close_token = makeCloseToken(reqData.id)
  return Response.json({ id: reqData.id, close_token }, { status: 201 })
}
