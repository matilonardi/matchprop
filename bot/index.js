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

// ── Fallback de zona por grupo ────────────────────────────────
// Cuando el parser no detecta zona, usamos el grupo como contexto.
const GROUP_ZONE_FALLBACK = {
  'NUEVA CBA':  ['Nueva Córdoba', 'General Paz'],
  'G PAZ':      ['General Paz', 'Nueva Córdoba'],
  'ZONA NORTE': ['Argüello', 'Villa Belgrano', 'Cerro de las Rosas', 'Villa Warcalde'],
  'NORTE':      ['Argüello', 'Villa Belgrano', 'Cerro de las Rosas'],
  'ZONA SUR':   ['Manantiales', 'San Carlos', 'Rincones de Manantiales'],
  'SUR':        ['Manantiales', 'San Carlos'],
  'CENTRO':     ['Centro', 'Nueva Córdoba', 'General Paz'],
  'COFICO':     ['Cofico', 'Alta Córdoba'],
  'ALBERDI':    ['Alberdi', 'Centro'],
}

function getGroupFallbackZones(groupName) {
  const upper = groupName.toUpperCase()
  for (const [key, zones] of Object.entries(GROUP_ZONE_FALLBACK)) {
    if (upper.includes(key)) return zones
  }
  return []
}

// ── Log de mensajes no procesados ────────────────────────────
const MISSED_FILE = './missed.json'

function logMissed(entry) {
  let missed = []
  try { missed = JSON.parse(fs.readFileSync(MISSED_FILE, 'utf8')) } catch {}
  missed.unshift({ ...entry, ts: new Date().toISOString() })
  fs.writeFileSync(MISSED_FILE, JSON.stringify(missed.slice(0, 100), null, 2))
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
// Mínimo de horas hacia atrás aunque last_run sea reciente (evita perder msgs entre runs)
const MIN_LOOKBACK_HOURS = parseInt(process.env.MIN_LOOKBACK_HOURS || '3')

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
  // Siempre mirar al menos MIN_LOOKBACK_HOURS atrás aunque last_run sea más reciente.
  // Los duplicados los rechaza la API — esto garantiza que mensajes entre runs no se pierdan.
  const minLookback = Date.now() - MIN_LOOKBACK_HOURS * 60 * 60 * 1000
  try {
    const data = JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8'))
    const stored = data.timestamp || 0
    return Math.min(stored, minLookback)
  } catch {
    // Primera vez: procesar últimas HOURS_BACK horas
    return Date.now() - HOURS_BACK * 60 * 60 * 1000
  }
}

function saveLastRun() {
  fs.writeFileSync(LAST_RUN_FILE, JSON.stringify({ timestamp: Date.now() }))
}

// Verifica si ya existe un pedido activo con el mismo teléfono + zona + presupuesto.
// Usa la API REST de Supabase directamente para evitar importar el SDK.
async function isDuplicate(phone, zones, budgetUsd) {
  if (!phone || phone.startsWith('LID_')) return false
  const supabaseUrl  = process.env.SUPABASE_URL
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return false
  try {
    const url = `${supabaseUrl}/rest/v1/buyer_requests?contact_phone=eq.${encodeURIComponent(phone)}&status=eq.active&select=id,zones,budget_usd`
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    if (!res.ok) return false
    const existing = await res.json()
    for (const req of existing) {
      const zoneMatch = (req.zones || []).some(z => zones.includes(z))
      const b1 = budgetUsd || 0
      const b2 = req.budget_usd || 0
      const budgetMatch = b1 === 0 || b2 === 0 || Math.abs(b1 - b2) / Math.max(b1, b2) < 0.15
      if (zoneMatch && budgetMatch) return true
    }
    return false
  } catch {
    return false
  }
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
    protocolTimeout: 300000, // 5 minutos
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
           '--disable-accelerated-2d-canvas', '--no-first-run', '--disable-gpu'],
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

  // Esperar a que WhatsApp Web sincronice los mensajes recientes del servidor
  await new Promise(r => setTimeout(r, 8000))

  // ── Modo discovery: listar grupos ────────────────────────────
  if (TARGET_GROUP_IDS.length === 0) {
    console.log('⚠️  TARGET_GROUP_IDS no configurado. Listando grupos...')
    const chats = await client.getChats()
    const groups = chats.filter(c => c.isGroup)
    console.log('━'.repeat(50))
    groups.sort((a, b) => b.timestamp - a.timestamp).forEach((g, i) => {
      console.log(`  [${i + 1}] ${g.name}`)
      console.log(`      ID: ${g.id._serialized}`)
      console.log()
    })
    console.log('━'.repeat(50))
    await client.destroy()
    return
  }

  // ── Modo batch: ir directo a los grupos por ID ───────────────
  const since    = getLastRun()
  const sinceStr = new Date(since).toLocaleString('es-AR')
  console.log(`📅 Procesando mensajes desde: ${sinceStr}\n`)

  let totalCreados   = 0
  let totalIgnorados = 0
  let totalMissed    = 0
  const missedList   = []

  for (const groupId of TARGET_GROUP_IDS) {
    let group
    try {
      group = await client.getChatById(groupId)
    } catch {
      console.log(`⚠️  Grupo no encontrado: ${groupId}`)
      continue
    }

    console.log(`📂 ${group.name}`)

    // 500 mensajes para cubrir hasta 15+ horas sin conexión en grupos activos
    const messages = await group.fetchMessages({ limit: 500 })
    const nuevos = messages.filter(m => m.timestamp * 1000 > since && !m.fromMe)

    console.log(`   ${nuevos.length} mensajes nuevos desde la última vez`)

    for (const msg of nuevos) {
      if (!msg.body || msg.body.length < 25) {
        console.log(`   ⏭ (msg corto, ${msg.body?.length ?? 0} chars)`)
        continue
      }

      const contact = await msg.getContact()
      const rawName = contact.pushname || contact.name || ''
      const name    = /^\d+$/.test(rawName) ? '' : rawName
      const preview = msg.body.substring(0, 60).replace(/\n/g, ' ')

      process.stdout.write(`   • ${name}: ${preview}... `)

      // Teléfono real: solo cuando server === 'c.us'
      // LID (@lid): identificador de privacidad de WhatsApp — no es número real,
      // pero lo usamos como ID único para no perder la búsqueda.
      let finalPhone = ''
      let isLID = false

      if (contact.id?.server === 'c.us' && /^\d{10,15}$/.test(contact.id.user)) {
        finalPhone = contact.id.user
      } else if (contact.id?.server === 'lid' && contact.id?.user) {
        // Intentar extraer número del texto primero
        const fromText = extractPhoneFromText(msg.body)
        if (fromText) {
          finalPhone = fromText
        } else {
          // Usar LID como fallback: garantiza unicidad aunque no sea un teléfono real
          finalPhone = contact.id.user
          isLID = true
        }
      }

      // Opción adicional: buscar número en el texto del mensaje
      if (!finalPhone) {
        const fromText = extractPhoneFromText(msg.body)
        if (fromText) finalPhone = fromText
      }

      // Sin ningún identificador → descartar
      if (!finalPhone) {
        process.stdout.write('→ ignorado (sin ID)\n')
        totalIgnorados++
        continue
      }

      // Parsear siempre — no depender del teléfono para decidir si es búsqueda
      const raw    = await parseMessage(msg.body)
      const parsed = raw ? sanitize(raw) : null

      if (!parsed) {
        process.stdout.write('→ ignorado\n')
        totalIgnorados++
        continue
      }

      // Fallback de zona: si el parser no detectó zona, usar la del grupo
      if (!parsed.zones?.length) {
        const fallback = getGroupFallbackZones(group.name)
        if (fallback.length) {
          parsed.zones = fallback
          process.stdout.write(`[zona fallback: ${fallback[0]}] `)
        }
      }

      // Sin zonas (ni parser ni fallback) → guardar para revisión
      if (!parsed.zones?.length) {
        process.stdout.write('→ ⚠️  sin zona\n')
        const entry = { group: group.name, name, phone: finalPhone, body: msg.body.slice(0, 300), parsed, reason: 'no_zones' }
        logMissed(entry)
        missedList.push(entry)
        totalMissed++
        continue
      }

      // Si es LID, agregar nota en description para que el broker sepa
      if (isLID && parsed.description) {
        parsed.description = `[Contactar por nombre en WA: ${name || 'ver grupo'}] ${parsed.description}`
      } else if (isLID) {
        parsed.description = `Contactar por nombre en WA: ${name || 'ver grupo'}`
      }

      // Deduplicación local antes de llamar a la API
      const dup = await isDuplicate(finalPhone, parsed.zones, parsed.budget_usd || 0)
      if (dup) {
        process.stdout.write('→ ↩ duplicado\n')
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
          source:         'whatsapp',
        })
        process.stdout.write(`→ ✅ creado (${id})\n`)
        totalCreados++
      } catch (err) {
        const errMsg = err.message || ''
        if (errMsg.includes('duplicate')) {
          process.stdout.write(`→ ↩ duplicado\n`)
          totalIgnorados++
        } else {
          process.stdout.write(`→ ❌ error: ${errMsg}\n`)
          const entry = { group: group.name, name, phone: finalPhone, body: msg.body.slice(0, 300), parsed, reason: 'api_error', error: errMsg }
          logMissed(entry)
          missedList.push(entry)
          totalMissed++
        }
      }
    }
    console.log()
  }

  // ── Resumen ───────────────────────────────────────────────────
  console.log('━'.repeat(50))
  console.log(`✅ Pedidos creados:  ${totalCreados}`)
  console.log(`⏭  Ignorados:       ${totalIgnorados}`)
  if (totalMissed > 0) console.log(`⚠️  Sin procesar:    ${totalMissed} (ver missed.json)`)
  console.log('━'.repeat(50))

  saveLastRun()

  // ── Notificación Telegram ─────────────────────────────────────
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const emoji = totalCreados > 0 ? '🏠' : '😴'

  let missedSection = ''
  if (missedList.length > 0) {
    const items = missedList.slice(0, 5).map(e => {
      const motivo = e.reason === 'no_phone' ? 'sin tel.' : e.reason === 'no_zones' ? 'sin zona' : 'error API'
      return `  • ${e.name || '(?)'}: ${e.body.slice(0, 80).replace(/\n/g, ' ')}… (${motivo})`
    }).join('\n')
    missedSection = `\n\n⚠️ <b>${totalMissed} búsqueda${totalMissed > 1 ? 's' : ''} sin procesar:</b>\n${items}`
  }

  const telegramMsg = totalCreados > 0
    ? `${emoji} <b>Propi Bot — ${fecha}</b>\n\n✅ <b>${totalCreados} pedidos nuevos</b> cargados.\n⏭ ${totalIgnorados} ignorados (ofertas, links, etc.)${missedSection}\n\n🔗 <a href="${MATCHPROP_URL}/pedidos">Ver pedidos</a>`
    : `${emoji} <b>Propi Bot — ${fecha}</b>\n\nSin pedidos nuevos.\n⏭ ${totalIgnorados} mensajes procesados.${missedSection}`
  await sendTelegram(telegramMsg)

  console.log('\n🏁 Listo. Podés cerrar la terminal.\n')

  await client.destroy()
  process.exit(0)
})

console.log('🚀 Iniciando Propi Bot...')
client.initialize()
