import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, agency_name, phone, email, password, zones } = body

  if (!name || !email || !password || !phone || !zones?.length) {
    return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return Response.json(
      { error: authError.message === 'User already registered' ? 'El email ya está registrado' : authError.message },
      { status: 400 }
    )
  }

  // Create broker profile
  const { error: profileError } = await supabase.from('broker_profiles').insert({
    user_id: authData.user.id,
    name,
    agency_name: agency_name || null,
    phone,
    email,
    zones,
    credits: 3, // 3 créditos gratis de bienvenida
  })

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  return Response.json({ success: true }, { status: 201 })
}
