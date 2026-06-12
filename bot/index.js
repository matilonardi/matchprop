require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { parseMessage } = require('./parser')
const fs = require('fs')

// ── Extractor de teléfono del texto del mensaje ──────────────
// Si WhatsApp no da un número válido (contacto no guardado),
// intenta encontrarlo en el cuerpo del mensaje.
function extractPhoneFromText(text) {
  // Buscar patrones argentinos: +54 9 XXXX XXXXXXX, 351XXXXXXX, etc.
  const patterns = [
    /(?:\+54\s*9?\s*)?(?:11|351|353|358|362|370|376|379|381|385|387|388|3512|3516|3517|3518|3519|3521|3522|3541|3543|3544|3546|3547|3548|3549|3562|3563|3564|3571|3572|3573|3574|3575|3576|3584|3585|3586)\s*[\d\s\-]{6,10}/g,
    /(?:\+54|0054)[\s\-]?9?[\s\-]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g,
    /\b(?:15[\s\-]?)?\d{4}[\s\-]?\d{4}\b/g,
  ]
  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      // Limpiar el número: sacar todo lo que no sea dígito
      const clean = matches[0].replace(/\D/g, '')
      // Normalizar: si empieza con 0 sacarlo, si no empieza con 54 agregar
      let normalized = clean.replace(/^0+/, '')
      if (!normalized.startsWith('54') && normalized.length <= 11) {
        normalized = '54' + (normalized.startsWith('9') ? normalized : '9' + normalized)
      }
      if (/^\d{10,15}$/.test(normalized)) return normalized
    }
  }
  return null
}

// ── Sanitización de valores del modelo ───────────────────────
const VALID_PROPERTY_TYPES = new Set(['casa','departamento','duplex','ph','terreno','local','renta','revaluo'])
const PROPERTY_TYPE_MAP = {
  'local comercial': 'local', 'comercial': 'local',
  'depto': 'departamento', 'dpto': 'departamento',
  'ph': 'ph', 'pent house': 'ph', 'penthouse': 'ph',
}
const VALID_FINANCING = new Set(['efectivo','credito','ambos'])

function sanitize(parsed) {
  // Normalizar property_types
  const types = (parsed.property_types || [])
    .map(t => {
      const lower = t.toLowerCase().trim()
      if (VALID_PROPERTY_TYPES.has(lower)) return lower
      return PROPERTY_TYPE_MAP[lower] || null
    })
    .filter(Boolean)

  // Normalizar financing
  let financing = (parsed.financing || 'efectivo').toLowerCase().trim()
  if (!VALID_FINANCING.has(financing)) financing = 'efectivo'

  return { ...parsed, property_types: types, financing }
}

// ── Config ────────────────────────────────────────────────────
const TARGET_GROUP_IDS = (process.env.TARGET_GROUP_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean)

const MATCHPROP_URL      = (process.env.MATCHPROP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')
const BOT_SECRET         = process.env.BOT_SECRET || ''
const LAST_RUN_FILE      = './last_run.json'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID || ''

// Cuántas horas hacia atrás buscar mensajes (default 25h para no perder nada)
const HOURS_BACK = parseInt(process.env.HOURS_BACK || '25')

// ── Telegram notificación ─────────────────────────────────────
async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    })
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────
function getLastRun() {
  try {
    const data = JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8'))
    return data.timestamp || 0
  } catch {
    // Primera vez: procesar últimas HOURS_BACK horas
    return Date.now() - HOURS_BACK * 60 * 60 * 1000
  }
}

function saveLastRun() {
  fs.writeFileSync(LAST_RUN_FILE, JSON.stringify({ timestamp: Date.now() }))
}

async function createPedido(body) {
  const res = await fetch(`${MATCHPROP_URL}/api/bot/pedido`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-bot-secret': BOT_SECRET },
    body:    JSON.stringify(body),
  })
  if (res.ok) {
    const data = await res.json()
    return data.id
  } else {
    const err = await res.text()
    throw new Error(err)
  }
}

// ── WhatsApp client ───────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
           '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote',
           '--single-process', '--disable-gpu'],
  },
})

client.on('qr', qr => {
  console.log('\n📱 Escaneá este QR con el celular de Nico:\n')
  qrcode.generate(qr, { small: true })
  console.log('\n(Solo hay que hacerlo una vez — la sesión queda guardada)\n')
})

client.on('authenticated', () => console.log('✅ Sesión autenticada'))
client.on('auth_failure', msg => { console.error('❌ Error de autenticación:', msg); process.exit(1) })

client.on('ready', async () => {
  console.log('\n🤖 Bot conectado!\n')

  const chats = await client.getChats()
  const groups = chats.filter(c => c.isGroup)

  // ── Modo discovery: listar grupos ────────────────────────────
  if (TARGET_GROUP_IDS.length === 0) {
    console.log('━'.repeat(50))
    console.log('⚠️  TARGET_GROUP_IDS no configurado.')
    console.log('   Grupos de Nico:\n')
    groups.sort((a, b) => b.timestamp - a.timestamp).forEach((g, i) => {
      console.log(`  [${i + 1}] ${g.name}`)
      console.log(`      ID: ${g.id._serialized}`)
      console.log(`      Participantes: ${g.participants?.length || '?'}`)
      console.log()
    })
    console.log('━'.repeat(50))
    console.log('👉 Copiame los IDs de los 3 grupos de brokers')
    console.log('   y los pongo en el .env:\n')
    console.log('   TARGET_GROUP_IDS=id1@g.us,id2@g.us,id3@g.us\n')
    await client.destroy()
    return
  }

  // ── Modo batch: procesar mensajes desde última ejecución ─────
  const since    = getLastRun()
  const sinceStr = new Date(since).toLocaleString('es-AR')
  console.log(`📅 Procesando mensajes desde: ${sinceStr}\n`)

  let totalCreados  = 0
  let totalIgnorados = 0

  for (const groupId of TARGET_GROUP_IDS) {
    const group = groups.find(g => g.id._serialized === groupId)
    if (!group) {
      console.log(`⚠️  Grupo no encontrado: ${groupId}`)
      continue
    }

    console.log(`📂 ${group.name}`)

    // Traer últimos 200 mensajes y filtrar por timestamp
    const messages = await group.fetchMessages({ limit: 200 })
    const nuevos = messages.filter(m => m.timestamp * 1000 > since && !m.fromMe)

    console.log(`   ${nuevos.length} mensajes nuevos desde la última vez`)

    for (const msg of nuevos) {
      if (!msg.body || msg.body.length < 25) continue

      const contact = await msg.getContact()
      // Usar pushname/name solo si no es un número puro (LID); si no hay nombre real, dejar vacío
      const rawName = contact.pushname || contact.name || ''
      const name    = /^\d+$/.test(rawName) ? '' : rawName
      const preview = msg.body.substring(0, 60).replace(/\n/g, ' ')

      process.stdout.write(`   • ${name}: ${preview}... `)

      // La clave: contact.id._serialized = '5493XXXXXXXXX@c.us' (número real)
      // msg.author = '116557090918492@lid' (LID de privacidad — NO es el teléfono)
      // contact.number devuelve el LID, NO el número real → ignorarlo
      let finalPhone = ''

      // Opción 1: contact.id.user cuando server === 'c.us' → número real
      if (contact.id?.server === 'c.us' && /^\d{10,15}$/.test(contact.id.user)) {
        finalPhone = contact.id.user
      }

      // Opción 2: fallback — buscar número en el texto del mensaje
      if (!/^\d{10,13}$/.test(finalPhone)) {
        const fromText = extractPhoneFromText(msg.body)
        if (fromText) finalPhone = fromText
      }

      // Validación final: teléfonos argentinos = 10-13 dígitos (ej: 5493516796777 = 13 dígitos)
      if (!/^\d{10,13}$/.test(finalPhone)) {
        process.stdout.write('→ ignorado (sin teléfono válido)\n')
        totalIgnorados++
        continue
      }

      const raw = await parseMessage(msg.body)
      const parsed = raw ? sanitize(raw) : null

      if (!parsed) {
        process.stdout.write('→ ignorado\n')
        totalIgnorados++
        continue
      }

      try {
        const id = await createPedido({
          request_type:   'property',
          property_types: parsed.property_types  || [],
          zones:          parsed.zones           || [],
          bedrooms_min:   parsed.bedrooms_min    || null,
          bedrooms_max:   parsed.bedrooms_max    || null,
          bathrooms_min:  parsed.bathrooms_min   || null,
          budget_usd:     parsed.budget_usd      || 0,
          financing:      parsed.financing       || 'efectivo',
          description:    parsed.description     || null,
          contact_name:   name,
          contact_phone:  finalPhone,
          publisher_type: 'inmobiliaria',
        })
        process.stdout.write(`→ ✅ creado (${id})\n`)
        totalCreados++
      } catch (err) {
        process.stdout.write(`→ ❌ error: ${err.message}\n`)
      }
    }
    console.log()
  }

  // ── Resumen ───────────────────────────────────────────────────
  console.log('━'.repeat(50))
  console.log(`✅ Pedidos creados:  ${totalCreados}`)
  console.log(`⏭  Ignorados:       ${totalIgnorados}`)
  console.log('━'.repeat(50))

  saveLastRun()

  // ── Notificación Telegram ─────────────────────────────────────
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const emoji = totalCreados > 0 ? '🏠' : '😴'
  const msg = totalCreados > 0
    ? `${emoji} <b>MatchProp Bot — ${fecha}</b>\n\n✅ <b>${totalCreados} pedidos nuevos</b> cargados desde los grupos de WhatsApp.\n⏭ ${totalIgnorados} mensajes ignorados (ofertas, links, etc.)\n\n🔗 <a href="${MATCHPROP_URL}/pedidos">Ver pedidos</a>`
    : `${emoji} <b>MatchProp Bot — ${fecha}</b>\n\nSin pedidos nuevos hoy.\n⏭ ${totalIgnorados} mensajes procesados.`
  await sendTelegram(msg)

  console.log('\n🏁 Listo. Podés cerrar la terminal.\n')

  await client.destroy()
  process.exit(0)
})

console.log('🚀 Iniciando MatchProp Bot...')
client.initialize()
