require('dotenv').config()
// ── Backfill desde un export de chat de WhatsApp ─────────────────────────
// Recupera búsquedas de días en que el bot estuvo caído: el bot always-on no
// puede leer historial (fetchMessages roto, issue wwebjs#5733), pero WhatsApp
// exporta el chat completo a .txt desde el celular (grupo → Exportar chat →
// Sin archivos). Este script corre ese export por el mismo pipeline del bot.
//
// Uso:
//   node backfill.js <export.txt> "<Nombre del grupo>" [--desde YYYY-MM-DD] [--hasta YYYY-MM-DD] [--dry]
//
//   --desde/--hasta  acotan el rango de fechas (inclusive, hora local)
//   --dry            muestra qué se crearía sin llamar a la API (Groq sí corre)
//
// Ejemplo:
//   node backfill.js zona_norte.txt "Zona Norte Team" --desde 2026-07-14 --dry
//
// Nota: varias funciones espejan a index.js a propósito (herramienta one-off;
// index.js no es importable porque arranca el cliente de WhatsApp al cargarse).
const fs = require('fs')
const crypto = require('crypto')
const { parseMessage, hasSearchIntent } = require('./parser')

// ── Args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flags = {}
const positional = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry') flags.dry = true
  else if (args[i] === '--desde') flags.desde = args[++i]
  else if (args[i] === '--hasta') flags.hasta = args[++i]
  else positional.push(args[i])
}
const [FILE, GROUP_NAME] = positional
if (!FILE || !GROUP_NAME) {
  console.error('Uso: node backfill.js <export.txt> "<Nombre del grupo>" [--desde YYYY-MM-DD] [--hasta YYYY-MM-DD] [--dry]')
  process.exit(1)
}
const SINCE = flags.desde ? new Date(flags.desde + 'T00:00:00') : null
const UNTIL = flags.hasta ? new Date(flags.hasta + 'T23:59:59') : null

const MATCHPROP_URL = (process.env.MATCHPROP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')
const BOT_SECRET    = process.env.BOT_SECRET || ''

// ── Helpers espejados de index.js ─────────────────────────────────────────
function extractPhoneFromText(text) {
  const patterns = [
    /(?:\+54\s*9?\s*)?(?:11|351|353|358|362|370|376|379|381|385|387|388|3512|3516|3517|3518|3519|3521|3522|3541|3543|3544|3546|3547|3548|3549|3562|3563|3564|3571|3572|3573|3574|3575|3576|3584|3585|3586)\s*[\d\s\-]{6,10}/g,
    /(?:\+54|0054)[\s\-]?9?[\s\-]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g,
    /\b(?:15[\s\-]?)?\d{4}[\s\-]?\d{4}\b/g,
  ]
  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      const clean = matches[0].replace(/\D/g, '')
      let normalized = clean.replace(/^0+/, '')
      if (!normalized.startsWith('54') && normalized.length <= 11) {
        normalized = '54' + (normalized.startsWith('9') ? normalized : '9' + normalized)
      }
      if (/^\d{10,15}$/.test(normalized)) return normalized
    }
  }
  return null
}

const VALID_PROPERTY_TYPES = new Set(['casa','departamento','duplex','ph','terreno','local','renta','revaluo'])
const PROPERTY_TYPE_MAP = {
  'local comercial': 'local', 'comercial': 'local',
  'depto': 'departamento', 'dpto': 'departamento',
  'ph': 'ph', 'pent house': 'ph', 'penthouse': 'ph',
}
const VALID_FINANCING = new Set(['efectivo','credito','ambos'])

function sanitize(parsed, text) {
  const types = (parsed.property_types || [])
    .map(t => {
      const lower = t.toLowerCase().trim()
      if (VALID_PROPERTY_TYPES.has(lower)) return lower
      return PROPERTY_TYPE_MAP[lower] || null
    })
    .filter(Boolean)

  let op = (parsed.operation_type || 'compra').toLowerCase().trim()
  if (op !== 'compra' && op !== 'alquiler') {
    if (text && hasSearchIntent(text)) op = 'compra'
    else return null
  }
  parsed.operation_type = op

  let financing = (parsed.financing || 'efectivo').toLowerCase().trim()
  if (!VALID_FINANCING.has(financing)) financing = 'efectivo'

  let budget_usd = Number(parsed.budget_usd) || 0
  let budget_ars = parsed.budget_ars != null ? Number(parsed.budget_ars) : null

  if (parsed.operation_type === 'alquiler') {
    if (budget_usd >= 20000 && !budget_ars) {
      budget_ars = budget_usd
      budget_usd = 0
    }
    if (budget_ars != null && (budget_ars < 80000 || budget_ars > 15000000)) budget_ars = null
    if (budget_usd && (budget_usd < 100 || budget_usd > 15000)) budget_usd = 0
  } else {
    if (budget_usd > 3000000) budget_usd = 0
  }

  return { ...parsed, property_types: types, financing, budget_usd, budget_ars }
}

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
  if (res.ok) return await res.json()
  throw new Error(await res.text())
}

// ── Parseo del export de WhatsApp ─────────────────────────────────────────
// Android: "18/7/26, 21:03 - Juan Pérez: mensaje"
// iOS:     "[18/7/26, 21:03:15] Juan Pérez: mensaje"
// Los mensajes multilínea continúan sin prefijo de fecha.
const ANDROID_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})\s+-\s+([^:]+):\s?([\s\S]*)$/
const IOS_RE     = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::\d{2})?\]\s+([^:]+):\s?([\s\S]*)$/

function parseExport(raw) {
  const messages = []
  let current = null
  for (const line of raw.split('\n')) {
    const clean = line.replace(/^‎|‎/g, '') // marcas LTR que mete iOS
    const m = clean.match(ANDROID_RE) || clean.match(IOS_RE)
    if (m) {
      if (current) messages.push(current)
      const [, d, mo, y, h, mi, sender, body] = m
      const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y)
      current = {
        date: new Date(year, parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(mi)),
        sender: sender.trim(),
        body: body || '',
      }
    } else if (current) {
      current.body += '\n' + clean
    }
    // Líneas de sistema (sin "sender:") antes del primer mensaje se ignoran solas.
  }
  if (current) messages.push(current)
  return messages
}

function senderPhone(sender) {
  // En el export, los contactos NO agendados aparecen como "+54 9 351 123-4567".
  const digits = sender.replace(/\D/g, '')
  if (sender.trim().startsWith('+') && /^\d{10,15}$/.test(digits)) return digits
  return null
}

// ── Pipeline ──────────────────────────────────────────────────────────────
;(async () => {
  const raw = fs.readFileSync(FILE, 'utf8')
  const all = parseExport(raw)
  const inRange = all.filter(m =>
    (!SINCE || m.date >= SINCE) && (!UNTIL || m.date <= UNTIL) &&
    m.body && m.body.length >= 25 &&
    !m.body.includes('<Multimedia omitido>') && !m.body.includes('omitted')
  )

  console.log(`📄 ${FILE}: ${all.length} mensajes en el export, ${inRange.length} candidatos en el rango.`)
  if (flags.dry) console.log('🧪 Modo DRY: no se crea nada.\n')

  let creados = 0, duplicados = 0, ignorados = 0, sinDatos = 0, errores = 0

  for (const msg of inRange) {
    const preview = msg.body.substring(0, 60).replace(/\n/g, ' ')
    process.stdout.write(`• [${msg.date.toLocaleString('es-AR')}] ${msg.sender.slice(0, 20)}: ${preview}... `)

    let raw
    try {
      raw = await parseMessage(msg.body)
    } catch {
      process.stdout.write('→ ⚠️ error de Groq (reintentá después)\n')
      errores++
      continue
    }
    const parsed = raw ? sanitize(raw, msg.body) : null
    if (!parsed) {
      process.stdout.write('→ ignorado\n')
      ignorados++
      continue
    }

    if (!parsed.zones?.length) {
      const fallback = getGroupFallbackZones(GROUP_NAME)
      if (fallback.length) parsed.zones = fallback
    }
    if (!parsed.zones?.length) {
      process.stdout.write('→ ⚠️ sin zona\n')
      sinDatos++
      continue
    }

    const name  = senderPhone(msg.sender) ? '' : msg.sender
    const phone = senderPhone(msg.sender) || extractPhoneFromText(msg.body)
    if (!phone) {
      process.stdout.write('→ ⚠️ sin teléfono (contacto agendado sin número en el texto)\n')
      sinDatos++
      continue
    }

    if (flags.dry) {
      process.stdout.write(`→ 🧪 se crearía: ${parsed.operation_type} ${(parsed.property_types || []).join('/')} en ${parsed.zones[0]} (tel ${phone})\n`)
      creados++
      continue
    }

    const dup = await isDuplicate(phone, parsed)
    if (dup) {
      process.stdout.write('→ ↩ duplicado\n')
      duplicados++
      continue
    }

    // ID sintético estable: correr el backfill dos veces no duplica nada
    // (la API rechaza por índice único de source_message_id).
    const syntheticId = 'backfill_' + crypto.createHash('sha1')
      .update(GROUP_NAME + '|' + msg.date.toISOString() + '|' + msg.sender + '|' + msg.body)
      .digest('hex').slice(0, 24)

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
        contact_phone:  phone,
        publisher_type: 'inmobiliaria',
        source:         'whatsapp',
        source_message_id: syntheticId,
      })
      if (result.duplicate) {
        process.stdout.write('→ ↩ duplicado (API)\n')
        duplicados++
      } else {
        process.stdout.write(`→ ✅ creado (${result.id})\n`)
        creados++
      }
    } catch (err) {
      process.stdout.write(`→ ❌ error: ${String(err.message).slice(0, 120)}\n`)
      errores++
    }
  }

  console.log('━'.repeat(50))
  console.log(`${flags.dry ? '🧪 Se crearían' : '✅ Creados'}:  ${creados}`)
  console.log(`↩  Duplicados:  ${duplicados}`)
  console.log(`⏭  Ignorados:   ${ignorados}`)
  console.log(`⚠️  Sin datos:   ${sinDatos} (sin zona o sin teléfono)`)
  if (errores) console.log(`❌ Errores:     ${errores}`)
  console.log('━'.repeat(50))
})()
