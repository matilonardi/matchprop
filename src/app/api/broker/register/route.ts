import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, agency_name, phone, email, password, zones, userId: existingUserId, skipAuthCreate, specialty } = body

  // skipAuthCreate = true when login succeeded but profile was missing
  if (skipAuthCreate) {
    if (!name || !email || !zones?.length || !existingUserId) {
      return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }
    const supabase = createServerClient()
    const profilePayload: Record<string, unknown> = {
      user_id: existingUserId,
      name,
      agency_name: agency_name || null,
      phone: phone || '',
      email,
      zones,
      credits: 2,
    }
    // specialty column requires migration 006 — include only if present
    if (specialty) profilePayload.specialty = specialty

    const { error: profileError } = await supabase.from('broker_profiles').insert(profilePayload)
    if (profileError) {
      return Response.json({ error: profileError.message }, { status: 500 })
    }
    return Response.json({ success: true }, { status: 201 })
  }

  if (!name || !email || !password || !phone || !zones?.length) {
    return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  // Create auth user via direct REST call (more reliable than supabase-js admin)
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })

  const authData = await authRes.json()

  if (!authRes.ok) {
    const msg = authData?.msg || authData?.message || 'Error al crear usuario'
    return Response.json(
      { error: msg.includes('already') ? 'El email ya está registrado. Si ya tenés cuenta, iniciá sesión en la pestaña "Iniciar sesión".' : msg },
      { status: 400 }
    )
  }

  const userId = authData.id

  // Create broker profile
  const supabase = createServerClient()
  const profilePayload: Record<string, unknown> = {
    user_id: userId,
    name,
    agency_name: agency_name || null,
    phone,
    email,
    zones,
    credits: 2,
  }
  // specialty column requires migration 006 — include only if present
  if (specialty) profilePayload.specialty = specialty

  const { error: profileError } = await supabase.from('broker_profiles').insert(profilePayload)

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  // Welcome email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '')
    await resend.emails.send({
      from: 'MatchProp <alertas@matchprop.com.ar>',
      to: email,
      subject: '¡Bienvenido a MatchProp! Tus 2 créditos gratis te esperan',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937;">
          <div style="background:#2563eb;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">¡Bienvenido a MatchProp!</h1>
          </div>
          <div style="background:#f9fafb;padding:28px 24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
            <p style="font-size:16px;">Hola <strong>${name}</strong>,</p>
            <p>Tu cuenta está activa. Recibiste <strong>2 créditos gratis</strong> para empezar a desbloquear contactos de compradores en tus zonas — sin pagar nada.</p>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin:16px 0;text-align:center;">
              <p style="margin:0;font-size:20px;">🎁</p>
              <p style="margin:4px 0 0;font-weight:bold;color:#c2410c;">2 créditos gratuitos activos</p>
              <p style="margin:4px 0 0;font-size:13px;color:#9a3412;">Usálos para ver el teléfono y WhatsApp de compradores en tus zonas.</p>
            </div>
            <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;font-weight:bold;">📍 Tus zonas registradas:</p>
              <p style="margin:0;color:#6b7280;">${zones.join(', ')}</p>
            </div>
            <p>Cada vez que un comprador publique una búsqueda en tus zonas, te vamos a avisar por email.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${appUrl}/pedidos"
                 style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
                Ver búsquedas activas →
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              MatchProp · Córdoba, Argentina<br>
              <a href="${appUrl}/broker/dashboard" style="color:#6b7280;">Ir a mi dashboard</a>
            </p>
          </div>
        </div>
      `,
    })
  } catch {
    // Email failure doesn't block registration
  }

  return Response.json({ success: true }, { status: 201 })
}
