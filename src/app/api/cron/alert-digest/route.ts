import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

// Digest de alertas: agrupa los pedidos nuevos en un solo email por broker.
// - Brokers con alert_frequency 'daily' → todos los días.
// - Brokers con alert_frequency 'weekly' → solo los lunes.
// Corre por cron (protegido por CRON_SECRET). 'instant' se maneja en /api/matching; 'off' nunca.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    || request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServerClient()
  const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://demandi.com.ar'

  // Lunes en hora Argentina (UTC-3) → incluir semanales
  const argDay = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCDay() // 0=Dom … 1=Lun
  const frequencies = argDay === 1 ? ['daily', 'weekly'] : ['daily']

  const { data: brokers } = await supabase
    .from('broker_profiles')
    .select('id, name, email, alert_frequency')
    .in('alert_frequency', frequencies)

  if (!brokers?.length) return Response.json({ ok: true, brokers: 0, sent: 0 })

  const typeLabels: Record<string, string> = {
    casa: 'Casa', departamento: 'Departamento', duplex: 'Dúplex', ph: 'PH',
    terreno: 'Terreno', local: 'Local', renta: 'Renta', revaluo: 'Revalúo',
  }

  let sent = 0

  for (const broker of brokers) {
    // Alertas pendientes de emailar para este broker
    const { data: alerts } = await supabase
      .from('broker_alerts')
      .select('id, request_id')
      .eq('broker_id', broker.id)
      .is('emailed_at', null)
      .limit(50)

    if (!alerts?.length) continue

    const reqIds = alerts.map((a) => a.request_id)
    const { data: pedidos } = await supabase
      .from('buyer_requests')
      .select('id, property_types, zones, budget_usd, budget_ars, operation_type')
      .in('id', reqIds)
      .eq('status', 'active')

    if (!pedidos?.length) {
      // Los pedidos ya no están activos → marcar como emailados igual para no reintentar
      await supabase.from('broker_alerts').update({ emailed_at: new Date().toISOString() })
        .eq('broker_id', broker.id).is('emailed_at', null)
      continue
    }

    const rows = pedidos.map((p) => {
      const tipos = (p.property_types || []).map((t: string) => typeLabels[t] || t).join(' / ') || 'Propiedad'
      const zona = (p.zones || []).slice(0, 2).join(', ')
      const precio = p.budget_ars ? `$ ${p.budget_ars.toLocaleString('es-AR')}`
        : p.budget_usd ? `USD ${p.budget_usd.toLocaleString()}` : 'A convenir'
      const op = p.operation_type === 'alquiler' ? 'Alquiler' : 'Compra'
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <strong>${tipos}</strong> · ${op} · ${zona}<br>
          <span style="color:#5c6b62;">${precio}</span>
          &nbsp;·&nbsp;<a href="${appUrl}/pedidos/${p.id}" style="color:#2E8B58;">Ver →</a>
        </td></tr>`
    }).join('')

    const periodo = broker.alert_frequency === 'weekly' ? 'esta semana' : 'hoy'
    try {
      await resend.emails.send({
        from: 'Demandi <alertas@demandi.com.ar>',
        to: broker.email,
        subject: `${pedidos.length} ${pedidos.length === 1 ? 'pedido nuevo' : 'pedidos nuevos'} en tus zonas`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#101512;">
            <h2 style="color:#2E8B58;">Pedidos nuevos en tus zonas</h2>
            <p>Hola ${broker.name}, hay <strong>${pedidos.length}</strong> ${pedidos.length === 1 ? 'búsqueda nueva' : 'búsquedas nuevas'} de compradores en tus zonas ${periodo}:</p>
            <table style="width:100%;border-collapse:collapse;">${rows}</table>
            <p style="margin-top:20px;">
              <a href="${appUrl}/pedidos" style="background:#2E8B58;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Ver todos los pedidos</a>
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
            <p style="color:#9ca3af;font-size:12px;">
              Recibís este resumen ${broker.alert_frequency === 'weekly' ? 'semanal' : 'diario'} porque así configuraste tus alertas.<br>
              <a href="${appUrl}/broker/dashboard" style="color:#6b7280;">Cambiar frecuencia de alertas</a>
            </p>
          </div>
        `,
      })
      sent++
    } catch (err) {
      console.error('[alert-digest] falló para', broker.email, err instanceof Error ? err.message : err)
      continue // no marcar como emailado si falló, para reintentar
    }

    // Marcar como emailados
    await supabase.from('broker_alerts').update({ emailed_at: new Date().toISOString() })
      .eq('broker_id', broker.id).is('emailed_at', null)
  }

  return Response.json({ ok: true, brokers: brokers.length, sent })
}
