import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  // Verificar secret de cron
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const weekAgo  = new Date(Date.now() - 7  * 24 * 3600 * 1000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  const [
    { count: totalActive },
    { count: pedidosWeek },
    { count: pedidosMonth },
    { count: totalBrokers },
    { count: brokersWeek },
    { data: leads },
    { count: leadsWeek },
    { data: requests },
  ] = await Promise.all([
    supabase.from('buyer_requests').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('buyer_requests').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('buyer_requests').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
    supabase.from('broker_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('broker_profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('lead_purchases').select('credits_spent'),
    supabase.from('lead_purchases').select('id', { count: 'exact', head: true }).gte('purchased_at', weekAgo),
    supabase.from('buyer_requests').select('views_count').eq('status', 'active'),
  ])

  const totalLeads = leads?.length ?? 0
  const totalCreditsSpent = (leads || []).reduce((s, p) => s + (p.credits_spent || 1), 0)
  const totalViews = (requests || []).reduce((s, r) => s + (r.views_count || 0), 0)

  const pulsoScore = Math.min(100, ((pedidosWeek ?? 0) * 3) + ((leadsWeek ?? 0) * 10) + ((brokersWeek ?? 0) * 5) + (totalViews > 0 ? 10 : 0))
  const pulsoLabel = pulsoScore >= 60 ? '🔥 Caliente' : pulsoScore >= 25 ? '🌤️ Tibio' : '❄️ Frío'

  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })

  const msg = `📡 <b>Propi — Reporte semanal</b>
${fecha}

<b>Temperatura: ${pulsoLabel} (${pulsoScore}/100)</b>

📥 <b>Pedidos</b>
  • Esta semana: ${pedidosWeek ?? 0}
  • Este mes: ${pedidosMonth ?? 0}
  • Activos total: ${totalActive ?? 0}

🔓 <b>Desbloqueos</b>
  • Esta semana: ${leadsWeek ?? 0}
  • Total histórico: ${totalLeads}
  • Créditos gastados: ${totalCreditsSpent}

🏢 <b>Brokers</b>
  • Nuevos esta semana: ${brokersWeek ?? 0}
  • Total registrados: ${totalBrokers ?? 0}

👁️ <b>Vistas totales del feed:</b> ${totalViews}

🔗 <a href="https://matchprop.vercel.app/admin">Ver admin</a>`

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (token && chatId) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' }),
    })
  }

  return NextResponse.json({ ok: true, pulsoScore, pedidosWeek, leadsWeek, brokersWeek })
}
