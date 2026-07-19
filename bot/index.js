require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { parseMessage, hasSearchIntent } = require('./parser')
const fs = require('fs')

// ── Extractor de teléfono del texto del mensaje ──────────────
// Si WhatsApp no da un número válido (contacto no guardado),
// intenta encontrarlo en el cuerpo del mensaje.
// Timeout genérico para llamadas a la API interna de WhatsApp Web (vía
// Puppeteer/Store) que pueden quedar colgadas sin nunca resolver NI
// rechazar — el mismo bug de fondo que getChats()/getChatById() (issue
// wwebjs/whatsapp-web.js#5733). Sin esto, un solo mensaje puede trabar el
// pipeline para siempre sin loguear absolutamente nada.
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout: ${label} (${ms}ms)`)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) }
    )
  })
}

// Parsea un id crudo tipo "5491155803400@c.us" o "XXXXX@lid" al mismo
// formato { user, server } que devuelve contact.id — sin depender de
// ninguna llamada async extra a Store.
function parseWaId(idString) {
  if (!idString) return null
  const at = idString.indexOf('@')
  if (at < 0) return null
  return { user: idString.slice(0, at), server: idString.slice(at + 1) }
}

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

function sanitize(parsed, text) {
  // Normalizar property_types
  const types = (parsed.property_types || [])
    .map(t => {
      const lower = t.toLowerCase().trim()
      if (VALID_PROPERTY_TYPES.has(lower)) return lower
      return PROPERTY_TYPE_MAP[lower] || null
    })
    .filter(Boolean)

  // Operación: solo 'compra' o 'alquiler' son búsquedas válidas.
  // El LLM a veces etiqueta "busco depto en venta" como 'venta': si el texto
  // tiene intención de búsqueda explícita es una compra, no una oferta.
  let op = (parsed.operation_type || 'compra').toLowerCase().trim()
  if (op !== 'compra' && op !== 'alquiler') {
    if (text && hasSearchIntent(text)) op = 'compra'
    else return null // oferta mal clasificada → descartar
  }
  parsed.operation_type = op

  // Normalizar financing
  let financing = (parsed.financing || 'efectivo').toLowerCase().trim()
  if (!VALID_FINANCING.has(financing)) financing = 'efectivo'

  // ── Saneamiento de presupuesto (determinístico, no depende del LLM) ──
  let budget_usd = Number(parsed.budget_usd) || 0
  let budget_ars = parsed.budget_ars != null ? Number(parsed.budget_ars) : null

  if (parsed.operation_type === 'alquiler') {
    // Los alquileres se cotizan en pesos. Si el LLM puso el monto en USD y es
    // demasiado alto para ser un alquiler en dólares (>20.000/mes), es pesos mal etiquetado.
    if (budget_usd >= 20000 && !budget_ars) {
      budget_ars = budget_usd
      budget_usd = 0
    }
    // Rangos plausibles de alquiler (Córdoba). Fuera de rango = error de parseo → "a convenir".
    //   ARS: ~$100.000 a $10.000.000/mes (uso bandas laxas 80k–15M)
    //   USD: hasta ~10.000/mes (uso 100–15.000)
    if (budget_ars != null && (budget_ars < 80000 || budget_ars > 15000000)) budget_ars = null
    if (budget_usd && (budget_usd < 100 || budget_usd > 15000)) budget_usd = 0
  } else {
    // Compra: montos absurdos (>3M USD en Córdoba) son error de parseo → "a convenir".
    if (budget_usd > 3000000) budget_usd = 0
  }

  return { ...parsed, property_types: types, financing, budget_usd, budget_ars }
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

// ── Cache de mensajes ya procesados ──────────────────────────
// Guarda los IDs de WhatsApp ya manejados para evitar reprocesar el mismo
// mensaje si WhatsApp lo re-entrega (pasa a veces en reconexiones de
// multi-device). Ya no se usa para "recuperar ventana perdida" — en modo
// always-on no hace falta, se procesa cada mensaje al momento en que llega.
const PROCESSED_FILE = './processed.json'
const MAX_PROCESSED = 8000

function loadProcessed() {
  try { return new Set(JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'))) } catch { return new Set() }
}
function saveProcessed(set) {
  // conservar solo los más recientes (Set mantiene orden de inserción)
  const arr = [...set].slice(-MAX_PROCESSED)
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(arr))
}

// ── Config ────────────────────────────────────────────────────
const TARGET_GROUP_IDS = (process.env.TARGET_GROUP_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean)
const TARGET_GROUP_SET = new Set(TARGET_GROUP_IDS)

// Falla ruidosa, no silenciosa: si esta lista queda vacía (ej. alguien
// comenta la línea en .env por error), el bot arranca "bien" pero filtra
// el 100% de los mensajes para siempre sin ninguna señal de que algo está
// mal. Esto ya pasó una vez — avisamos fuerte para que no vuelva a pasar
// desapercibido.
if (TARGET_GROUP_SET.size === 0) {
  console.error('❌ TARGET_GROUP_IDS está vacío o no configurado — el bot NO va a procesar ningún mensaje. Revisá el archivo .env.')
}

// Nombres de los grupos, hardcodeados a propósito: antes se resolvían con
// client.getChatById(id).name, pero esa llamada es justo la que está rota
// en WhatsApp Web ahora (ver comentario en 'message' handler más abajo).
// Solo se usan para logging y para el fallback de zona — no son críticos,
// así que un ID nuevo sin nombre acá simplemente muestra el ID crudo.
const GROUP_NAMES = {
  '120363142502886742@g.us': 'NUEVA CBA Y G PAZ',
  '120363139126417574@g.us': 'Zona Norte Team',
  '120363143003526405@g.us': 'Zona Sur Team',
  '120363142169193128@g.us': 'Centro, Cofico, Alberdi',
}

const MATCHPROP_URL      = (process.env.MATCHPROP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')
const BOT_SECRET         = process.env.BOT_SECRET || ''
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID || ''

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

// ── Crash-proofing ────────────────────────────────────────────
// El bot ahora corre 24/7 (modo always-on, ver 'message' handler), así que
// no puede simplemente morir ante cualquier error interno — eso significaría
// dejar de escuchar mensajes hasta que alguien lo note y lo reinicie a mano.
//
// - unhandledRejection: son justamente los errores internos de WhatsApp Web
//   que estamos esquivando (getChats/getChatById rotos) — se loguean y el
//   bot SIGUE corriendo. No son fatales, whatsapp-web.js los tira de fondo.
// - uncaughtException: algo más serio (ej. el ProtocolError de Puppeteer que
//   vimos en producción) — ahí sí preferimos salir con código 1 para que
//   launchd relance el proceso desde cero en vez de seguir en un estado raro.
let lastCrashAlertAt = 0
async function alertCrash(kind, err, { fatal }) {
  console.error(`❌ ${kind}${fatal ? ' (fatal)' : ' (ignorado, sigue corriendo)'}:`, err)
  // No floodear Telegram si el mismo error interno se repite muchas veces por hora.
  const now = Date.now()
  if (!fatal && now - lastCrashAlertAt < 30 * 60 * 1000) return
  lastCrashAlertAt = now
  await sendTelegram(
    `${fatal ? '🔴' : '🟡'} <b>Propi Bot — ${kind}</b>\n\n${String(err?.message || err).slice(0, 300)}\n\n${fatal ? 'El bot se reinicia solo.' : 'El bot sigue corriendo, esto se ignora (es el bug conocido de WhatsApp Web).'}`
  )
}

process.on('uncaughtException', (err) => {
  alertCrash('uncaughtException', err, { fatal: true }).finally(() => process.exit(1))
})
process.on('unhandledRejection', (err) => {
  alertCrash('unhandledRejection', err, { fatal: false })
})

// Verifica si ya existe un pedido activo reciente con el mismo teléfono + operación + zona + presupuesto.
// Usa la API REST de Supabase directamente para evitar importar el SDK.
// ⚠️ Criterio estricto a propósito: un falso positivo acá descarta un lead en silencio.
//   - Ventana de 7 días (los brokers publican búsquedas nuevas de otros clientes todo el tiempo).
//   - Presupuesto 0 ("a convenir") solo matchea con otro 0 — antes 0 matcheaba con todo
//     y, combinado con el fallback de zona por grupo, terminaba descartando casi todos
//     los mensajes de brokers recurrentes como "duplicado".
const DEDUP_WINDOW_DAYS = parseInt(process.env.DEDUP_WINDOW_DAYS || '7')

async function isDuplicate(phone, parsed) {
  if (!phone) return false
  const supabaseUrl  = process.env.SUPABASE_URL
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return false
  try {
    const since = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const url = `${supabaseUrl}/rest/v1/buyer_requests?contact_phone=eq.${encodeURIComponent(phone)}&status=eq.active&created_at=gte.${since}&select=id,zones,budget_usd,budget_ars,operation_type`
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    if (!res.ok) return false
    const existing = await res.json()
    const op = parsed.operation_type || 'compra'
    const isAlq = op === 'alquiler'
    for (const req of existing) {
      if ((req.operation_type || 'compra') !== op) continue
      const zoneMatch = (req.zones || []).some(z => parsed.zones.includes(z))
      if (!zoneMatch) continue
      const b1 = (isAlq ? parsed.budget_ars : parsed.budget_usd) || 0
      const b2 = (isAlq ? req.budget_ars : req.budget_usd) || 0
      const budgetMatch = (b1 === 0 && b2 === 0) ||
        (b1 > 0 && b2 > 0 && Math.abs(b1 - b2) / Math.max(b1, b2) < 0.15)
      if (budgetMatch) return true
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
    // 201 = creado · 200 = la API lo detectó como duplicado ({ id, duplicate: true })
    return await res.json()
  } else {
    const err = await res.text()
    throw new Error(err)
  }
}

const processedIds = loadProcessed()

// ── Procesa un mensaje individual (llamado desde el listener 'message') ──
async function processMessage(msg, groupName) {
  const msgId = msg.id?._serialized
  if (msgId) {
    if (processedIds.has(msgId)) return // ya lo vimos (re-entrega de WA)
    processedIds.add(msgId)
    saveProcessed(processedIds)
  }

  if (!msg.body || msg.body.length < 25) return

  // msg.getContact() consulta el Store interno de WhatsApp Web — es el mismo
  // tipo de llamada que está rota/inestable en la build nueva (getChats(),
  // getChatById()). Si se cuelga, NO puede trabar el pedido para siempre:
  // le ponemos timeout y, si falla, seguimos con los datos que ya vienen
  // en el mensaje (msg.author) sin necesitar esa consulta extra.
  let contact = null
  let rawName = ''
  try {
    contact = await withTimeout(msg.getContact(), 8000, 'msg.getContact')
    rawName = contact.pushname || contact.name || ''
  } catch (err) {
    console.warn(`⚠️  msg.getContact() falló/timeout en ${groupName} (sigo sin nombre de contacto):`, err.message)
  }
  if (!rawName) rawName = msg._data?.notifyName || ''
  const name    = /^\d+$/.test(rawName) ? '' : rawName
  const preview = msg.body.substring(0, 60).replace(/\n/g, ' ')

  process.stdout.write(`[${groupName}] ${name}: ${preview}... `)

  // Id del remitente: si contact.id no está disponible (getContact falló),
  // msg.author (grupos) / msg.from (DMs) traen el mismo dato sin depender
  // de ninguna otra llamada a Store.
  const senderId = contact?.id || parseWaId(msg.author) || parseWaId(msg.from)

  // Teléfono real: solo cuando server === 'c.us'
  // LID (@lid): identificador de privacidad de WhatsApp — no es número real,
  // pero lo usamos como ID único para no perder la búsqueda.
  let finalPhone = ''
  let isLID = false

  if (senderId?.server === 'c.us' && /^\d{10,15}$/.test(senderId.user)) {
    finalPhone = senderId.user
  } else if (senderId?.server === 'lid' && senderId?.user) {
    const fromText = extractPhoneFromText(msg.body)
    if (fromText) {
      finalPhone = fromText
    } else {
      finalPhone = senderId.user
      isLID = true
    }
  }

  if (!finalPhone) {
    const fromText = extractPhoneFromText(msg.body)
    if (fromText) finalPhone = fromText
  }

  if (!finalPhone) {
    process.stdout.write('→ ignorado (sin ID)\n')
    return
  }

  let raw
  try {
    raw = await parseMessage(msg.body)
  } catch (err) {
    // Error transitorio de Groq (conexión/rate limit): desmarcar como
    // procesado para no perderlo — como ya no hay "próxima corrida" que
    // reintente automáticamente, esto solo evita que quede marcado como
    // visto; si querés reintentarlo hay que reenviarlo o reiniciar el bot.
    if (err?.transient && msgId) processedIds.delete(msgId)
    process.stdout.write('→ ⚠️ error transitorio\n')
    const entry = { group: groupName, name, phone: finalPhone, body: msg.body.slice(0, 300), reason: 'parse_error', error: err?.message }
    logMissed(entry)
    return
  }
  const parsed = raw ? sanitize(raw, msg.body) : null

  if (!parsed) {
    process.stdout.write('→ ignorado\n')
    return
  }

  // Fallback de zona: si el parser no detectó zona, usar la del grupo
  if (!parsed.zones?.length) {
    const fallback = getGroupFallbackZones(groupName)
    if (fallback.length) {
      parsed.zones = fallback
      process.stdout.write(`[zona fallback: ${fallback[0]}] `)
    }
  }

  if (!parsed.zones?.length) {
    process.stdout.write('→ ⚠️  sin zona\n')
    logMissed({ group: groupName, name, phone: finalPhone, body: msg.body.slice(0, 300), parsed, reason: 'no_zones' })
    return
  }

  if (isLID && parsed.description) {
    parsed.description = `[Contactar por nombre en WA: ${name || 'ver grupo'}] ${parsed.description}`
  } else if (isLID) {
    parsed.description = `Contactar por nombre en WA: ${name || 'ver grupo'}`
  }

  const dup = await isDuplicate(finalPhone, parsed)
  if (dup) {
    process.stdout.write('→ ↩ duplicado\n')
    return
  }

  try {
    const result = await createPedido({
      request_type:   'property',
      operation_type: parsed.operation_type  || 'compra',
      property_types: parsed.property_types  || [],
      zones:          parsed.zones           || [],
      bedrooms_min:   parsed.bedrooms_min    || null,
      bedrooms_max:   parsed.bedrooms_max    || null,
      bathrooms_min:  parsed.bathrooms_min   || null,
      budget_usd:     parsed.budget_usd      || 0,
      budget_ars:     parsed.budget_ars      || null,
      financing:      parsed.financing       || 'efectivo',
      description:    parsed.description     || null,
      contact_name:   name,
      contact_phone:  finalPhone,
      publisher_type: 'inmobiliaria',
      source:         'whatsapp',
      source_message_id: msgId || null,
    })
    if (result.duplicate) {
      // La API lo detectó como duplicado (mismo source_message_id o mismo
      // teléfono+zona+tipo reciente) — no es un pedido nuevo, no avisar.
      process.stdout.write(`→ ↩ duplicado (API)\n`)
      return
    }
    process.stdout.write(`→ ✅ creado (${result.id})\n`)
    await sendTelegram(
      `🏠 <b>Nuevo pedido — Propi Bot</b>\n\n${name || 'Alguien'} en <b>${groupName}</b> busca ${(parsed.property_types || []).join('/') || 'propiedad'} en ${parsed.zones.slice(0, 2).join(', ')}.\n\n🔗 <a href="${MATCHPROP_URL}/pedidos/${result.id}">Ver pedido</a>`
    )
  } catch (err) {
    const errMsg = err.message || ''
    if (errMsg.includes('duplicate')) {
      process.stdout.write(`→ ↩ duplicado\n`)
    } else {
      process.stdout.write(`→ ❌ error: ${errMsg}\n`)
      if (msgId) processedIds.delete(msgId)
      logMissed({ group: groupName, name, phone: finalPhone, body: msg.body.slice(0, 300), parsed, reason: 'api_error', error: errMsg })
    }
  }
}

// ── WhatsApp client ───────────────────────────────────────────
// webVersionCache: por default whatsapp-web.js carga la ÚLTIMA build de
// WhatsApp Web. Probamos pinear una build vieja y estable y también
// 'none' (sin cachear ninguna) — ninguna cambió nada, WhatsApp le sigue
// asignando la misma build nueva a esta cuenta sin importar qué le pidamos
// del lado del cliente. Se deja en 'none' por ser la opción más simple.
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: true,
    protocolTimeout: 300000, // 5 minutos
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
           '--disable-accelerated-2d-canvas', '--no-first-run', '--disable-gpu'],
  },
  webVersionCache: {
    type: 'none',
  },
})

let qrAlerted = false
let qrExitTimer = null
client.on('qr', qr => {
  console.log('\n📱 Escaneá este QR con el celular de Nico:\n')
  qrcode.generate(qr, { small: true })
  console.log('\n(Solo hay que hacerlo una vez — la sesión queda guardada)\n')
  // Corriendo por launchd nadie ve este QR: avisar que la sesión se cayó.
  if (!qrAlerted) {
    qrAlerted = true
    sendTelegram('📱 <b>Propi Bot</b>: la sesión de WhatsApp expiró — el bot está pidiendo QR. Correr <code>node index.js</code> a mano en la Mac y escanear.')
    // Con QR pendiente el watchdog de arranque (90s) no alcanza para escanear:
    // dar 10 min y recién ahí salir para que launchd relance.
    clearTimeout(readyWatchdog)
    qrExitTimer = setTimeout(() => {
      console.error('❌ QR no escaneado en 10 min — salgo para reintentar.')
      process.exit(1)
    }, 10 * 60 * 1000)
  }
})

client.on('authenticated', () => {
  console.log('✅ Sesión autenticada')
  // El QR ya fue escaneado: cancelar el timer de salida.
  clearTimeout(qrExitTimer)
})

client.on('auth_failure', async msg => {
  console.error('❌ Error de autenticación:', msg)
  await sendTelegram('🔴 <b>Propi Bot</b>: sesión de WhatsApp inválida (auth_failure). Hay que volver a escanear el QR en la Mac.')
  process.exit(1)
})

// Si se desconecta, salimos para que launchd relance el proceso y arranque
// una sesión limpia — whatsapp-web.js no siempre se recupera bien de una
// desconexión sin reiniciar el Client.
client.on('disconnected', async (reason) => {
  console.warn('⚠️  Desconectado:', reason)
  await sendTelegram(`🟡 <b>Propi Bot desconectado</b>\n\nMotivo: ${reason}\nSe reinicia solo.`)
  process.exit(1)
})

client.on('ready', async () => {
  console.log('\n🤖 Bot conectado! Escuchando mensajes en vivo...\n')
  try {
    const wwebVersion = await client.getWWebVersion()
    console.log(`📦 WhatsApp Web version cargada: ${wwebVersion}`)
  } catch (e) {
    console.log('⚠️  No se pudo leer la versión de WhatsApp Web:', e.message)
  }
  await sendTelegram('🟢 <b>Propi Bot conectado</b>\n\nEscuchando los grupos configurados en vivo.')
})

// ── Modo always-on: procesar cada mensaje al momento en que llega ─────────
// Antes el bot hacía client.getChatById(groupId) + chat.fetchMessages() para
// "ir a buscar" el historial de cada grupo — esa es justo la función de
// WhatsApp Web que está rota ahora mismo (bug de whatsapp-web.js, no
// nuestro: github.com/wwebjs/whatsapp-web.js/issues/5733). El evento
// 'message' que dispara cuando llega un mensaje NO pasa por ese código
// roto, así que lo esquivamos escuchando en vivo en vez de pedir la lista.
//
// Tradeoff: si la Mac se duerme o el bot se cae un rato, los mensajes que
// llegaron mientras estaba parado NO se recuperan solos (antes sí, con la
// ventana de 48h). Mitigado por: el crash-proofing de arriba (se reinicia
// solo) + que la Mac tiene que estar prendida para el bot igual.
// message_create (no 'message'): el fix de la comunidad usó message_create,
// que parece ser más confiable en builds nuevas de WhatsApp Web / multi-device.
// Dispara para mensajes entrantes Y salientes, por eso filtramos fromMe.
client.on('message_create', async (msg) => {
  // Modo debug (DEBUG_ALL_MESSAGES=1 node index.js): loguear TODO lo que
  // llega — DMs y cualquier grupo — con su chat id. Sirve para verificar que
  // el listener está vivo sin esperar actividad en los grupos monitoreados,
  // y para descubrir el ID de un grupo nuevo antes de sumarlo a
  // TARGET_GROUP_IDS (reemplaza al viejo "modo discovery").
  if (process.env.DEBUG_ALL_MESSAGES === '1') {
    console.log(`🐛 [debug] chat=${msg.from} fromMe=${msg.fromMe} chars=${msg.body?.length ?? 0} "${(msg.body || '').slice(0, 40).replace(/\n/g, ' ')}"`)
  }

  // Filtrar ANTES de loguear nada — evita procesar/imprimir cada mensaje de
  // cada chat (tus DMs, Estados de WhatsApp, otros grupos ajenos a Demandi).
  if (msg.fromMe) return
  if (!TARGET_GROUP_SET.has(msg.from)) return // no es uno de los 4 grupos configurados

  const groupName = GROUP_NAMES[msg.from] || msg.from
  console.log(`📩 [${groupName}] mensaje entrante (${msg.body?.length ?? 0} chars)`)
  try {
    await processMessage(msg, groupName)
  } catch (err) {
    // No dejar que un error al procesar UN mensaje mate el listener entero.
    console.error(`❌ Error procesando mensaje en ${groupName}:`, err)
  }
})

console.log('🚀 Iniciando Propi Bot...')

// Watchdog de arranque: client.initialize() abre Chrome vía Puppeteer contra
// la carpeta de sesión guardada. Si quedó un Chrome anterior vivo (o un
// lock file trabado) usando esa misma carpeta, la llamada se cuelga para
// siempre — no tira error, no conecta, no loguea nada más. Sin límite de
// tiempo, launchd nunca se entera (el proceso "sigue corriendo" aunque no
// hace nada) y el bot queda muerto en los hechos sin que nadie lo note.
const READY_TIMEOUT_MS = 90_000
const readyWatchdog = setTimeout(() => {
  console.error(`❌ El bot no terminó de conectar en ${READY_TIMEOUT_MS / 1000}s (posible sesión de Chrome trabada) — salgo para que se reintente.`)
  sendTelegram('🔴 <b>Propi Bot</b>\n\nNo terminó de conectar a tiempo (posible sesión de Chrome trabada). Reintentando...')
    .finally(() => process.exit(1))
}, READY_TIMEOUT_MS)
client.on('ready', () => clearTimeout(readyWatchdog))

client.initialize()
