import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const { request_id } = await request.json()
  if (!request_id) return Response.json({ error: 'request_id requerido' }, { status: 400 })

  const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
  const supabase = createServerClient()

  // Get the buyer request
  const { data: req } = await supabase
    .from('buyer_requests')
    .select('id, property_types, zones, bedrooms_min, budget_usd, financing')
    .eq('id', request_id)
    .single()

  if (!req) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 })

  // Find brokers with matching zones (simple overlap matching)
  const { data: matchingBrokers } = await supabase
    .from('broker_profiles')
    .select('id, name, email, zones')
    .overlaps('zones', req.zones)
    .limit(50)

  if (!matchingBrokers?.length) return Response.json({ matched: 0 })

  // Record alerts and send emails
  const alertRows = matchingBrokers.map((b) => ({
    broker_id: b.id,
    request_id: req.id,
  }))

  await supabase.from('broker_alerts').upsert(alertRows, { onConflict: 'broker_id,request_id' })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const requestUrl = `${appUrl}/pedidos/${req.id}`

  const typeLabels: Record<string, string> = {
    casa: 'Casa', departamento: 'Departamento', duplex: 'Dúplex', ph: 'PH',
  }
  const types = req.property_types.map((t: string) => typeLabels[t] || t).join(' / ')
  const zones = req.zones.slice(0, 3).join(', ')

  // Send email notifications (batch, max 50/hour on Resend free tier)
  const emailPromises = matchingBrokers.slice(0, 10).map((broker) =>
    resend.emails.send({
      from: 'Demandi <alertas@matchprop.com.ar>',
      to: broker.email,
      subject: `Nuevo pedido en tu zona: ${types} en ${zones}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#2563eb;">Nuevo pedido en tu zona</h2>
          <p>Hola ${broker.name},</p>
          <p>Hay un comprador buscando <strong>${types}</strong> en <strong>${zones}</strong>
          con un presupuesto de hasta <strong>USD ${req.budget_usd.toLocaleString()}</strong>.</p>
          <p>
            <a href="${requestUrl}"
               style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
              Ver pedido completo
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">
            Podés ver todos los detalles antes de decidir si desbloquear el contacto.<br>
            Este comprador publicó que quiere comprar ${req.financing === 'efectivo' ? 'en efectivo' : req.financing === 'credito' ? 'con crédito hipotecario' : 'en efectivo o con crédito'}.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
          <p style="color:#9ca3af;font-size:12px;">
            Recibís este email porque registraste zonas compatibles en Demandi.<br>
            <a href="${appUrl}/broker/dashboard" style="color:#6b7280;">Gestionar mis alertas</a>
          </p>
        </div>
      `,
    }).catch((err) => console.error('[email] falló alerta de matching para broker:', broker.email, err?.message ?? err))
  )

  await Promise.allSettled(emailPromises)

  return Response.json({ matched: matchingBrokers.length })
}
