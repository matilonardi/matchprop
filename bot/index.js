require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { parseMessage } = require('./parser')
const fs = require('fs')

// ── Config ────────────────────────────────────────────────────
const TARGET_GROUP_IDS = (process.env.TARGET_GROUP_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean)

const MATCHPROP_URL = (process.env.MATCHPROP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')
const BOT_SECRET    = process.env.BOT_SECRET || ''
const LAST_RUN_FILE = './last_run.json'

// Cuántas horas hacia atrás buscar mensajes (default 25h para no perder nada)
const HOURS_BACK = parseInt(process.env.HOURS_BACK || '25')

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
      const phone   = contact.number
      const name    = contact.pushname || contact.name || phone
      const preview = msg.body.substring(0, 60).replace(/\n/g, ' ')

      process.stdout.write(`   • ${name}: ${preview}... `)

      const parsed = await parseMessage(msg.body)

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
          contact_phone:  phone,
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
  console.log('\n🏁 Listo. Podés cerrar la terminal.\n')

  await client.destroy()
  process.exit(0)
})

console.log('🚀 Iniciando MatchProp Bot...')
client.initialize()
