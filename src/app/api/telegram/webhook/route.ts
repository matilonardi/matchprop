import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// ─────────────────────────────────────────────────────────────
// AI parser — extracts structured data from a free-form search text
// ─────────────────────────────────────────────────────────────
async function parseRequestWithAI(text: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Sos un asistente que parsea mensajes de grupos inmobiliarios de WhatsApp de Córdoba, Argentina. Extraé información estructurada de búsquedas de propiedades.

Devolvé ÚNICAMENTE un JSON válido con estos campos (omití los que no puedas inferir):
{
  "property_types": array de: "casa" | "departamento" | "duplex" | "terreno" | "local",
  "zones": array de barrios/zonas mencionados (tal como aparecen en el texto),
  "budget_usd": número entero en USD (si dice "mil" multiplicá × 1000; si dice "millones" de pesos ignorá y no incluyas; solo USD/U$S/U$D/dólares),
  "bedrooms_min": número mínimo de dormitorios/habitaciones,
  "bedrooms_max": número máximo (si dice "2/3" → min:2 max:3),
  "bathrooms_min": número mínimo de baños,
  "financing": "efectivo" | "credito" | "ambos",
  "financing_types": array de "efectivo" | "credito" | "permuta_propiedad" | "permuta_auto",
  "requirements": array de IDs de requisitos que apliquen,
  "requirements_excluyentes": array de IDs de requisitos marcados como excluyentes/SI O SI,
  "urgency": "esta_semana" | "este_mes" | "flexible",
  "contact_name": nombre del contacto si aparece explícitamente,
  "contact_phone": teléfono si aparece,
  "description": resumen del pedido en 1-2 oraciones claras
}

IDs de requisitos disponibles:
- apta_credito: propiedad apta crédito hipotecario
- una_sola_planta: una sola planta / planta baja / sin escaleras
- con_escritura: con escritura al día
- desocupado: desocupada / sin inquilinos / entrega inmediata
- patio: con patio
- cochera_techada: cochera techada o cubierta
- pileta: pileta / piscina
- gas_natural: gas natural
- jardin: jardín o patio grande
- sum: SUM / amenities
- antiguedad: moderno / menos de 15 años
- terraza: terraza o balcón
- en_pozo: en pozo / a estrenar
- housing: housing / barrio privado / barrio cerrado

Reglas clave:
- "apto/apta crédito" → financing:"credito", requirements incluye "apta_credito"
- "efectivo"/"contado"/"de contado" → financing:"efectivo"
- "una sola planta"/"planta baja"/"sin escaleras"/"1 planta" → "una_sola_planta"
- "con escritura" si es excluyente → requirements_excluyentes incluye "con_escritura"
- "housing"/"barrio cerrado"/"barrio privado" → "housing" en requirements
- algo marcado como "excluyente"/"SI O SI"/"EXCLUYENTE" → va en requirements_excluyentes
- "para cerrar ya"/"urgente"/"esta semana" → urgency:"esta_semana"
- "entrega lote"/"parte de pago"/"permuta" → financing_types incluye "permuta_propiedad"
- Si no especifica financiación → financing:"ambos"`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
    max_tokens: 600,
  })

  const content = response.choices[0].message.content || '{}'
  // Strip markdown code fences if present
  const jsonStr = content
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()
  return JSON.parse(jsonStr)
}

// ─────────────────────────────────────────────────────────────
// Send a reply back to Telegram
// ─────────────────────────────────────────────────────────────
async function sendTelegramMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  }).catch(() => {})
}

// ─────────────────────────────────────────────────────────────
// POST — Telegram webhook
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Verify Telegram secret token header (optional but recommended)
  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
  if (WEBHOOK_SECRET && secretHeader !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: true })
  }

  const message = body.message as Record<string, unknown> | undefined
  if (!message) return Response.json({ ok: true })

  const chatId = (message.chat as Record<string, unknown>)?.id as number
  const fromUser = message.from as Record<string, unknown> | undefined
  const text = (message.text as string) || ''

  if (!text.trim() || !chatId) return Response.json({ ok: true })

  // Ignore commands
  if (text.startsWith('/')) {
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        `👋 *Bienvenido al bot de MatchProp*\n\nReenvíame cualquier búsqueda inmobiliaria y la cargo automáticamente en la plataforma.\n\nEjemplo:\n_Busco casa 3 dormitorios zona norte, hasta USD 200.000, apta crédito_`
      )
    }
    return Response.json({ ok: true })
  }

  // Let the user know we're processing
  await sendTelegramMessage(chatId, '⏳ Parseando el pedido con IA...')

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: Record<string, any> = {}
    try {
      parsed = await parseRequestWithAI(text)
    } catch (parseErr) {
      console.error('AI parse error:', parseErr)
      await sendTelegramMessage(chatId, '❌ Error al parsear el mensaje. Intentá de nuevo o simplificá el texto.')
      return Response.json({ ok: true })
    }

    // Validate minimum required fields
    if (!parsed.budget_usd && !parsed.zones?.length) {
      await sendTelegramMessage(
        chatId,
        '⚠️ No pude detectar zona ni presupuesto en el mensaje.\n\nAsegurate que el texto mencione barrio/zona y presupuesto en USD.'
      )
      return Response.json({ ok: true })
    }

    const supabase = createServerClient()

    // Build contact info
    const telegramUser = fromUser?.username
      ? `@${fromUser.username}`
      : fromUser?.first_name
      ? String(fromUser.first_name)
      : 'Telegram'

    const contactName = parsed.contact_name || `Cargado por ${telegramUser}`
    const contactPhone = parsed.contact_phone || 'Ver descripción'

    // Insert
    const { data, error } = await supabase
      .from('buyer_requests')
      .insert({
        request_type: 'property',
        property_types: parsed.property_types?.length ? parsed.property_types : ['casa'],
        zones: parsed.zones || [],
        budget_usd: parsed.budget_usd || 0,
        financing: parsed.financing || 'ambos',
        financing_types: parsed.financing_types || [],
        bedrooms_min: parsed.bedrooms_min || null,
        bedrooms_max: parsed.bedrooms_max || null,
        bathrooms_min: parsed.bathrooms_min || null,
        requirements: parsed.requirements || [],
        requirements_excluyentes: parsed.requirements_excluyentes || [],
        description: parsed.description
          ? `${parsed.description}\n\n[Original: ${text.slice(0, 300)}]`
          : text.slice(0, 600),
        urgency: parsed.urgency || null,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: null,
      })
      .select('id')
      .single()

    if (error) throw error

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app'
    const typeLabel = (parsed.property_types || ['propiedad'])
      .map((t: string) => ({ casa: '🏠', departamento: '🏢', duplex: '🏘️', terreno: '🌿', local: '🏪' }[t] || t))
      .join('/')
    const zonesLabel = (parsed.zones || []).slice(0, 3).join(', ')
    const budget = parsed.budget_usd
      ? `USD ${Number(parsed.budget_usd).toLocaleString('es-AR')}`
      : 'sin especificar'

    await sendTelegramMessage(
      chatId,
      `✅ *Pedido cargado en MatchProp*\n\n` +
        `${typeLabel} en *${zonesLabel}*\n` +
        `💰 Hasta ${budget}\n` +
        (parsed.bedrooms_min ? `🛏 ${parsed.bedrooms_min}${parsed.bedrooms_max ? `-${parsed.bedrooms_max}` : '+'} dormitorios\n` : '') +
        (parsed.requirements?.includes('apta_credito') ? `✅ Apta crédito\n` : '') +
        (parsed.requirements?.includes('una_sola_planta') ? `✅ Una sola planta\n` : '') +
        `\n🔗 [Ver pedido](${appUrl}/pedidos/${data.id})`
    )

    // Trigger AI matching
    try {
      fetch(`${appUrl}/api/matching`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: data.id }),
      }).catch(() => {})
    } catch {}
  } catch (err) {
    console.error('Telegram webhook error:', err)
    await sendTelegramMessage(chatId, '❌ Error al guardar el pedido. Revisá los logs.')
  }

  return Response.json({ ok: true })
}
