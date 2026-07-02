import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const VALID_REASONS = [
  'vendida',
  'contacto_incorrecto',
  'falso',
  'cliente_encontro',
  'otro',
]

const REASON_LABELS: Record<string, string> = {
  vendida:             'Propiedad ya vendida/alquilada',
  contacto_incorrecto: 'Contacto incorrecto',
  falso:               'Pedido falso o spam',
  cliente_encontro:    'El cliente ya encontró lo que buscaba',
  otro:                'Otro motivo',
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await props.params
  const body = await request.json()
  const { broker_user_id, reason } = body

  if (!requestId) {
    return Response.json({ error: 'Parámetros requeridos' }, { status: 400 })
  }

  if (!VALID_REASONS.includes(reason)) {
    return Response.json({ error: 'Motivo inválido' }, { status: 400 })
  }

  const supabase = createServerClient()

  let brokerId: string | null = null

  if (broker_user_id) {
    const { data: broker } = await supabase
      .from('broker_profiles')
      .select('id')
      .eq('user_id', broker_user_id)
      .single()

    if (broker) {
      brokerId = broker.id

      // 1 report per broker per request
      const { data: existing } = await supabase
        .from('request_reports')
        .select('id')
        .eq('broker_id', brokerId)
        .eq('request_id', requestId)
        .single()

      if (existing) {
        return Response.json({ error: 'Ya reportaste este pedido' }, { status: 409 })
      }
    }
  }

  const { error } = await supabase.from('request_reports').insert({
    request_id: requestId,
    broker_id: brokerId,
    reason,
    status: 'pending',
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Fetch request details for the email
  const { data: req } = await supabase
    .from('buyer_requests')
    .select('id, property_types, zones, budget_usd, budget_ars, operation_type, contact_name')
    .eq('id', requestId)
    .single()

  // Send admin notification (fire-and-forget)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'
    const reqSummary = req
      ? `${req.property_types?.join(', ')} · ${req.zones?.slice(0, 2).join(', ')} · ${req.budget_ars ? `$ ${req.budget_ars.toLocaleString('es-AR')}` : req.budget_usd ? `USD ${req.budget_usd.toLocaleString()}` : 'sin precio'}`
      : requestId

    await resend.emails.send({
      from: 'Demandi <alertas@matchprop.com.ar>',
      to: 'lonardimatias@gmail.com',
      subject: `⚠️ Nuevo reporte: ${REASON_LABELS[reason] || reason}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2937;">
          <div style="background:#dc2626;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h2 style="color:white;margin:0;font-size:20px;">⚠️ Pedido reportado</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 16px;font-size:15px;"><strong>Motivo:</strong> ${REASON_LABELS[reason] || reason}</p>
            <p style="margin:0 0 8px;font-size:15px;"><strong>Pedido:</strong> ${reqSummary}</p>
            ${req?.contact_name ? `<p style="margin:0 0 8px;font-size:15px;"><strong>Publicado por:</strong> ${req.contact_name}</p>` : ''}
            <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">ID: ${requestId}</p>
            <a href="${appUrl}/pedidos/${requestId}" style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Ver publicación →</a>
          </div>
        </div>
      `,
    })
  } catch { /* email failure doesn't affect the response */ }

  return Response.json({ ok: true }, { status: 201 })
}
