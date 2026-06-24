import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { createHmac } from 'crypto'

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000

const OUTCOME_LABELS: Record<string, string> = {
  nada:             'Nada',
  envie_opciones:   'Envié opciones',
  hubo_visita:      'Hubo visita',
  hubo_negociacion: 'Hubo negociación',
  hubo_reserva:     'Hubo reserva',
  hubo_venta:       '¡Hubo venta! 🎉',
}

function makeToken(leadId: string, outcome: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'secret'
  return createHmac('sha256', secret).update(`${leadId}:${outcome}`).digest('hex').slice(0, 32)
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    || request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const resend = new Resend(process.env.RESEND_API_KEY || '')
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')

  // Find eligible leads: 10+ days old, no outcome, no survey email sent yet
  const cutoff = new Date(Date.now() - TEN_DAYS_MS).toISOString()

  const { data: leads } = await supabase
    .from('lead_purchases')
    .select('id, broker_id, request_id, purchased_at')
    .is('outcome', null)
    .is('survey_email_sent_at', null)
    .lte('purchased_at', cutoff)
    .limit(50)

  if (!leads?.length) return Response.json({ sent: 0 })

  // Fetch broker emails and request info
  const brokerIds = [...new Set(leads.map(l => l.broker_id))]
  const requestIds = [...new Set(leads.map(l => l.request_id))]

  const [{ data: brokers }, { data: requests }] = await Promise.all([
    supabase.from('broker_profiles').select('id, email, name').in('id', brokerIds),
    supabase.from('buyer_requests').select('id, property_types, zones, budget_usd, contact_name').in('id', requestIds),
  ])

  const brokerMap = Object.fromEntries((brokers || []).map(b => [b.id, b]))
  const reqMap = Object.fromEntries((requests || []).map(r => [r.id, r]))

  let sent = 0
  const sentIds: string[] = []

  for (const lead of leads) {
    const broker = brokerMap[lead.broker_id]
    const req = reqMap[lead.request_id]
    if (!broker?.email || !req) continue

    const purchasedDate = new Date(lead.purchased_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })
    const zones = (req.zones as string[]).slice(0, 2).join(', ')
    const types = (req.property_types as string[]).join(', ')

    const outcomeButtons = Object.entries(OUTCOME_LABELS).map(([value, label]) => {
      const token = makeToken(lead.id, value)
      const href = `${appUrl}/api/leads/survey?lid=${lead.id}&outcome=${value}&token=${token}`
      const isPositive = ['hubo_reserva', 'hubo_venta'].includes(value)
      const bg = isPositive ? '#16a34a' : '#2563eb'
      return `<a href="${href}" style="display:inline-block;background:${bg};color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;margin:4px;">${label}</a>`
    }).join('\n')

    try {
      await resend.emails.send({
        from: 'MatchProp <alertas@matchprop.com.ar>',
        to: broker.email,
        subject: `¿Qué pasó con la búsqueda de ${req.contact_name}?`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
            <div style="background:#2563eb;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:22px;">📋 Encuesta de seguimiento</h1>
            </div>
            <div style="background:#f9fafb;padding:28px 24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
              <p style="font-size:16px;">Hola <strong>${broker.name}</strong>,</p>
              <p>El <strong>${purchasedDate}</strong> desbloqueaste el contacto de:</p>
              <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
                <p style="margin:0;font-weight:bold;font-size:16px;">${req.contact_name}</p>
                <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">📍 ${zones} · ${types} · USD ${Number(req.budget_usd).toLocaleString()}</p>
              </div>
              <p style="font-weight:bold;font-size:17px;margin:20px 0 12px;">¿Qué pasó con esta búsqueda?</p>
              <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">Hacé clic en la opción que mejor describe lo que ocurrió:</p>
              <div style="text-align:center;">
                ${outcomeButtons}
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                MatchProp · Córdoba, Argentina<br>
                También podés responder desde <a href="${appUrl}/broker/dashboard" style="color:#6b7280;">tu dashboard</a>.
              </p>
            </div>
          </div>
        `,
      })
      sentIds.push(lead.id)
      sent++
    } catch {
      // Continue with next lead if email fails
    }
  }

  // Mark emails as sent
  if (sentIds.length) {
    await supabase
      .from('lead_purchases')
      .update({ survey_email_sent_at: new Date().toISOString() })
      .in('id', sentIds)
  }

  return Response.json({ sent })
}
