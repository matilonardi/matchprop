require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { parseMessage } = require('./parser')

// ── Config ────────────────────────────────────────────────────
const TARGET_GROUP_IDS = (process.env.TARGET_GROUP_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const MATCHPROP_URL = (process.env.MATCHPROP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')
const BOT_SECRET    = process.env.BOT_SECRET || ''

// ── WhatsApp client ───────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
})

// ── Eventos de conexión ───────────────────────────────────────
client.on('qr', qr => {
  console.log('\n📱 Escaneá este QR con el celular de Nico:\n')
  qrcode.generate(qr, { small: true })
  console.log('\n(Solo hay que hacerlo una vez — la sesión queda guardada)\n')
})

client.on('authenticated', () => {
  console.log('✅ Sesión autenticada')
})

client.on('auth_failure', msg => {
  console.error('❌ Error de autenticación:', msg)
  process.exit(1)
})

client.on('disconnected', reason => {
  console.log('🔌 Desconectado:', reason)
  // Intentar reconectar automáticamente
  setTimeout(() => {
    console.log('🔄 Reconectando...')
    client.initialize()
  }, 10000)
})

client.on('ready', async () => {
  console.log('\n🤖 MatchProp Bot listo!\n')

  if (TARGET_GROUP_IDS.length === 0) {
    // Modo discovery: listar grupos disponibles
    console.log('━'.repeat(50))
    console.log('⚠️  TARGET_GROUP_IDS no configurado.')
    console.log('   Grupos disponibles:\n')
    const chats = await client.getChats()
    const groups = chats
      .filter(c => c.isGroup)
      .sort((a, b) => b.timestamp - a.timestamp)

    groups.forEach((g, i) => {
      const count = g.participants?.length || '?'
      console.log(`  [${i + 1}] ${g.name}`)
      console.log(`      ID: ${g.id._serialized}`)
      console.log(`      Participantes: ${count}`)
      console.log()
    })
    console.log('━'.repeat(50))
    console.log('👉 Copiá los IDs de los 3 grupos y ponelos en el .env:')
    console.log('   TARGET_GROUP_IDS=id_grupo1,id_grupo2,id_grupo3\n')
  } else {
    console.log(`👀 Monitoreando ${TARGET_GROUP_IDS.length} grupo(s)`)
    TARGET_GROUP_IDS.forEach(id => console.log(`   • ${id}`))
    console.log()
  }
})

// ── Procesamiento de mensajes ─────────────────────────────────
// IMPORTANTE: el bot NUNCA escribe en los grupos — solo lee en silencio.
const processedIds = new Set()

client.on('message', async msg => {
  try {
    // Solo mensajes de grupo
    if (!msg.from.endsWith('@g.us')) return

    // Solo grupos configurados (si están definidos)
    if (TARGET_GROUP_IDS.length > 0 && !TARGET_GROUP_IDS.includes(msg.from)) return

    // Evitar duplicados
    const msgId = msg.id._serialized
    if (processedIds.has(msgId)) return
    processedIds.add(msgId)
    // Limpiar cache después de 1000 mensajes para no crecer infinito
    if (processedIds.size > 1000) {
      const first = processedIds.values().next().value
      processedIds.delete(first)
    }

    // Ignorar mensajes propios (doble seguridad — el evento 'message' ya los filtra)
    if (msg.fromMe) return

    // Ignorar mensajes muy cortos
    if (!msg.body || msg.body.length < 25) return

    // Obtener datos del remitente
    const contact = await msg.getContact()
    const phone   = contact.number                              // número real 🎯
    const name    = contact.pushname || contact.name || phone

    const preview = msg.body.substring(0, 80).replace(/\n/g, ' ')
    console.log(`📩 [${new Date().toLocaleTimeString()}] ${name}: ${preview}...`)

    // Parsear con IA
    const parsed = await parseMessage(msg.body)

    if (!parsed) {
      console.log('   → No es búsqueda, ignorado\n')
      return
    }

    console.log(`   → Búsqueda detectada: ${parsed.property_types?.join('/')} en ${parsed.zones?.join(', ')} (USD ${parsed.budget_usd})`)

    // Crear pedido en MatchProp
    const body = {
      request_type:    'property',   // estos grupos son solo propiedades
      property_types:  parsed.property_types  || [],
      zones:           parsed.zones           || [],
      bedrooms_min:    parsed.bedrooms_min    || null,
      bedrooms_max:    parsed.bedrooms_max    || null,
      bathrooms_min:   parsed.bathrooms_min   || null,
      budget_usd:      parsed.budget_usd      || 0,
      financing:       parsed.financing       || 'efectivo',
      description:     parsed.description     || null,
      contact_name:    name,
      contact_phone:   phone,
      publisher_type:  'inmobiliaria',
    }

    const res = await fetch(`${MATCHPROP_URL}/api/bot/pedido`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-bot-secret':  BOT_SECRET,
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const data = await res.json()
      console.log(`   ✅ Pedido creado (ID: ${data.id})\n`)
    } else {
      const err = await res.text()
      console.log(`   ❌ Error al crear pedido: ${err}\n`)
    }

  } catch (err) {
    console.error('Error procesando mensaje:', err.message)
  }
})

// ── Arrancar ──────────────────────────────────────────────────
console.log('🚀 Iniciando MatchProp WhatsApp Bot...')
client.initialize()
