require('dotenv').config()

const SUPABASE_URL        = 'https://aqndahpjtkjgmwyltruy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbmRhaHBqdGtqZ213eWx0cnV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMwMTgyMSwiZXhwIjoyMDk0ODc3ODIxfQ.AaQiiCUJyFqJ0ZSs1eUPCw5M7nixMLythzORpUB7XXg'
const TELEGRAM_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN || '8831510212:AAEBZR15S2_H6OaODCTbxoPi8PLqcBI-mVI'
const TELEGRAM_CHAT_ID    = process.env.TELEGRAM_CHAT_ID   || '5318125242'
const MATCHPROP_URL       = (process.env.MATCHPROP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')

async function fetchTodayPedidos() {
  // Córdoba = UTC-3. Inicio del día local en UTC.
  const now = new Date()
  const offsetMs = 3 * 60 * 60 * 1000
  const localMidnight = new Date(now.getTime() - offsetMs)
  localMidnight.setUTCHours(0, 0, 0, 0)
  const since = new Date(localMidnight.getTime() + offsetMs).toISOString()

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/buyer_requests?created_at=gte.${since}&order=created_at.asc&select=contact_name,zones,property_types,budget_usd,financing`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
  })
}

;(async () => {
  const pedidos = await fetchTodayPedidos()
  const total = pedidos.length

  const fecha = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Argentina/Cordoba',
  })

  let msg
  if (total === 0) {
    msg = `😴 <b>Resumen diario — ${fecha}</b>\n\nSin pedidos nuevos hoy.`
  } else {
    const lineas = pedidos.map(p => {
      const nombre = p.contact_name || 'Sin nombre'
      const zonas  = (p.zones || []).slice(0, 2).join(', ') || '—'
      const tipo   = (p.property_types || []).join('/') || '—'
      const budget = p.budget_usd ? `USD ${p.budget_usd.toLocaleString('es-AR')}` : 'a convenir'
      return `  • <b>${nombre}</b> — ${tipo} en ${zonas} (${budget})`
    }).join('\n')

    msg = `🏠 <b>Resumen diario — ${fecha}</b>\n\n` +
          `✅ <b>${total} pedido${total !== 1 ? 's' : ''} nuevos</b> cargados hoy:\n\n` +
          `${lineas}\n\n` +
          `🔗 <a href="${MATCHPROP_URL}/pedidos">Ver todos los pedidos</a>`
  }

  await sendTelegram(msg)
  console.log(`✅ Resumen enviado: ${total} pedidos hoy.`)
})()
