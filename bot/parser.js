const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const ZONES = `Acosta,Alberdi,Almirante Brown,Alqarias,Alta Córdoba,Alta Gracia,Alto Alberdi,Alto Verde,Altos de Manantiales,Altos del Chateau,Ameghino Norte,Ameghino Sud,Ampliación Empalme,Ampliación Las Palmas,Anisacate,Argüello,Argüello Norte,Ascochinga,Ayacucho,Bajo Palermo,Bell Ville,Bella Vista,Bicentenario,Bouwer,Brisas de Manantiales,Cabana,Campos de Manantiales,Cañitas,Cañuelas Country,Capilla del Monte,Causana,Centro,Cerro de las Rosas,Chacras de la Villa,Chateau Carreras,Ciudad de los Niños,Cofico,Colinas de Manantiales,Colinas de Vélez Sársfield,Colonia Caroya,Colonia Lola,Comarca,Condominios del Valle,Cosquín,Costa Azul,Costas de Manantiales,Country Club Jockey,Crisol Norte,Crisol Sur,Cruz del Eje,Cuatro Hojas,Cuesta Colorada,Cumbres,Cumbres del Golf,Cupani,Deán Funes,Docta,Docta Avenida,Docta Boulevard,Docta Central,Docta Parque,Docta Soho,Don Bosco,Ducasse,Dumesnil,Duplares,Ejército Argentino,El Balcón,El Bosque,El Perchel,El Prado,El Talar,Empalme,Estación Juárez Celman,Estancia Q2,Ferreyra,Fontanas del Sur,Fortín del Pozo,General Paz,Golf,Granja de Funes,Green Park,Greenville,Güemes,Heredades,Hermitage,Hipódromo,Housing del Valle,Inaudi,Ipona,Ituzaingó,Jardín,Jardín Claret,Jardín del Pilar,Jardín Espinosa,Jardín Hipódromo,Jesús María,José Ignacio Díaz,Juniors,Kennedy,La Calera,La Carolina,La Cascada,La Cercanía,La Cuesta,La Cumbre,La Cumbrecita,La Deseada,La Falda,La Herradura,La Luisita,La Morada,La Reserva,La Rosella,La Rufina,La Serena,Laguna Larga,Las Corzuelas,Las Delicias,Las Margaritas,Las Palmas,Las Veras,Lofts,Lomas de la Carolina,Lomas de Mendiolaza,Lomas de Villa Allende,Lomas Este,Lomas Sur,Los Árboles,Los Aromas,Los Boulevares,Los Carolinos,Los Cielos,Los Naranjos,Los Nogales,Los Pinos,Los Plátanos,Los Reartes,Los Robles,Los Soles,Los Sueños,Los Vascos,Maipú,Maipú I,Maipú II,Malagueño,Maldonado,Manantiales,Manantiales I,Manantiales II,Mansos del Sur,Marcos Juárez,Marqués de Sobremonte,Marqués de Sobremonte Anexo,Mendiolaza,Mirador del Chateau,Miradores de Manantiales,Miralta,Mitte,Nobu,Nueva Córdoba,Nueva Italia,Nuevo Urca,Ñu Porá,O'Higgins,Observatorio,Oncativo,Pacífico,Parque Capital,Parque Chacabuco,Parque Chateau Carreras,Parque Futura,Parque Montecristo,Parque Vélez Sársfield,Parterres,Paso de los Andes,Patagonia Village,Patricios,Piedras Blancas,Pilar,Poblado,Poeta Lugones,Portón de Piedra,Providencia,Pueyrredón,Quebrada de las Rosas,Quebrada Honda,Quebradas de Manantiales,Quintas de Italia,Quintas de San Isidro,Quintas de Santa Ana,Renacimiento,Residencial América,Residencial San Carlos,Residencial Vélez Sarsfield,Rincones de Manantiales,Río Ceballos,Río Cuarto,Río Tercero,Rogelio Martínez,Rosedal,Saldán,Salsipuedes,San Alfonso,San Antonio,San Carlos,San Fernando,San Francisco,San Ignacio Village,San Lorenzo,San Martín,San Remo,San Vicente,Santa Ana,Santa Rita,Santa Rosa de Calamuchita,Santina Norte,Santina Sur,Senda,SEP,Sierra Nueva,Siete Soles,Sinsacate,Sol y Río,Solares de Manantiales,Tablada Park,Talar,Talleres,Tejas del Sur,Terrazas de Manantiales,Terrazas del Valle,Tierra Alta,Toledo,Tropezon,Unquillo,Urca,Valle del Sol,Valle Escondido,Valle Hermoso,Verandas,Villa Adela,Villa Allende,Villa Aspacia,Villa Belgrano,Villa Cabrera,Villa Carlos Paz,Villa Catalina,Villa del Dique,Villa del Lago,Villa del Parque,Villa Díaz,Villa El Libertador,Villa General Belgrano,Villa Giardino,Villa María,Villa Martínez,Villa Páez,Villa Revol,Villa Rivera Indarte,Villa Warcalde,Villasol,Yocsina,Yofre Sud`

const SYSTEM_PROMPT = `Sos un asistente que analiza mensajes de grupos de WhatsApp de inmobiliarios en Córdoba, Argentina.
Estos grupos son SOLO de propiedades — nunca hay autos.

Tu tarea: determinar si el mensaje es una búsqueda activa de propiedad para un cliente comprador.

IGNORAR — devolver null si:
- Es un saludo, buenos días, gracias, emoji solo
- Es una respuesta corta ("sí", "dale", "👍", "ok")
- Es una OFERTA: el broker tiene una propiedad para VENDER o ALQUILAR
  ("tengo casa en...", "vendo...", "ofrezco...", "disponible...", "en venta...")
- Es una consulta de precio o información general
- No menciona zona ni tipo de propiedad
- Es muy vago o incompleto

PROCESAR — si el broker busca propiedad para un CLIENTE que quiere COMPRAR:
("busco", "necesito", "cliente busca", "tengo comprador", "solicito", etc.)

Tipos de propiedad válidos (elegí uno o más):
casa, departamento, duplex, ph, terreno, local, renta, revaluo

Zonas válidas — usá EXACTAMENTE estos nombres, mapeá variantes informales:
${ZONES}
Ejemplos de mapeo:
- "nva cba"→"Nueva Córdoba", "bº gral paz"→"General Paz", "v belgrano"→"Villa Belgrano"
- "zona norte" o "norte de cba" → ["Argüello","Villa Belgrano","Cerro de las Rosas","Villa Warcalde"]
- "zona sur" o "sur de cba" o "corredor sur" → ["Manantiales","San Carlos","San Antonio","Tejas del Sur"]
- "zona centro" → ["Centro","Nueva Córdoba","General Paz"]
- "Quebrada" o "quebradas" → "Quebradas de Manantiales"
- "Rincones" → "Rincones de Manantiales"
- "Brisas" → "Brisas de Manantiales"
- "Cuestas" → "Manantiales"
- "Solares" → "Solares de Manantiales"
- "Terrazas" → "Terrazas de Manantiales"
- "Colinas" → "Colinas de Manantiales"
- "Miradores" → "Miradores de Manantiales"
- "Manantiales 1" o "Mant 1" → "Manantiales I"
- "Manantiales 2" o "Mant 2" → "Manantiales II"
- "Barrio Jardín" o "B° Jardín" → "Jardín"
- "Gral Paz" o "Bº Gral Paz" → "General Paz"
- "Alta Cba" o "Alta Córdoba" → "Alta Córdoba"
- "Nva Cba" → "Nueva Córdoba"

Para el presupuesto:
- "USD X" o "u$s X" → budget_usd: X
- "$X millones" → dividí por 1200 para convertir a USD
- "a convenir", "consultar", sin mención → budget_usd: 0
- "permuta" → financing: "permuta_propiedad"
- "crédito hipotecario" → financing: "credito"
- "efectivo" o sin mención → financing: "efectivo"
- "efectivo o crédito" → financing: "ambos"

Respondé SOLO con JSON válido o la palabra null. Sin explicaciones.

Formato JSON:
{
  "property_types": ["casa"],
  "zones": ["Argüello", "Villa Belgrano"],
  "bedrooms_min": 3,
  "bedrooms_max": null,
  "bathrooms_min": null,
  "budget_usd": 200000,
  "financing": "efectivo",
  "description": "Resumen breve de la búsqueda en máx 150 caracteres"
}`

// ── Pre-filtro JavaScript (sin llamada a API) ─────────────────
// Descarta mensajes que claramente NO son búsquedas de propiedad.
// Ahorra tokens de Groq en mensajes obvios.
const OFFER_KEYWORDS = [
  'vendo ', 'vende ', 'en venta', 'a la venta', 'venta!', 'venta.',
  'alquilo ', 'alquila ', 'en alquiler', 'para alquilar',
  'ofrezco', 'ofrecemos', 'disponible', 'disponibles',
  'tengo casa', 'tengo depto', 'tengo departamento', 'tengo duplex',
  'tengo ph', 'tengo lote', 'tengo terreno', 'tengo local',
  'tenemos casa', 'tenemos depto', 'tenemos departamento',
  'comparto ', 'compartimos ',
  'estrenar', 'a estrenar',
  'precio:', 'precio ',
  'permuto', 'permuta ',
]

const SEARCH_KEYWORDS = [
  'busco', 'buscamos', 'busca', 'búsqueda', 'busqueda',
  'necesito', 'necesita', 'necesitamos',
  'cliente busca', 'cliente necesita', 'tengo comprador', 'tengo cliente',
  'solicito', 'solicitamos',
  'requerimiento', 'pedido',
  'requiero', 'requiere',
]

function isObviousNonSearch(text) {
  const t = text.toLowerCase()

  // Descartar contactos vCard
  if (t.includes('begin:vcard')) return true

  // Descartar mensajes que son solo URLs (ficha.info, zonaprop, argenprop, etc.)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const urlPattern = /^https?:\/\//i
  if (lines.every(l => urlPattern.test(l) || l.length < 5)) return true

  // Si tiene palabras de oferta Y no tiene palabras de búsqueda → descartar
  const hasOffer  = OFFER_KEYWORDS.some(k => t.includes(k))
  const hasSearch = SEARCH_KEYWORDS.some(k => t.includes(k))

  if (hasOffer && !hasSearch) return true

  return false
}

async function parseMessage(text) {
  // Pre-filtro rápido sin costo de API
  if (isObviousNonSearch(text)) return null

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Mensaje: "${text}"` },
        ],
        max_tokens: 400,
        temperature: 0,
      })

      const content = response.choices[0].message.content.trim()
      if (!content || content === 'null') return null

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0])
      if (!parsed.zones?.length && !parsed.property_types?.length) return null

      return parsed
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message?.includes('rate')
      if (isRateLimit && attempt < MAX_RETRIES) {
        const wait = attempt * 3000 // 3s, 6s
        console.error(`   ⏳ Groq rate limit, reintento ${attempt}/${MAX_RETRIES} en ${wait/1000}s...`)
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      console.error('Error parseando mensaje:', err.message)
      return null
    }
  }
  return null
}

module.exports = { parseMessage }
