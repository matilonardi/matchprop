<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# MatchProp — Contexto del proyecto

## ¿Qué es?
Marketplace inmobiliario de **demanda inversa** para Córdoba, Argentina.
- **Compradores** publican gratis lo que buscan (propiedad o auto).
- **Brokers** pagan créditos para ver el contacto del comprador.
- Modelo: compradores gratis · brokers pagan 1 crédito por contacto desbloqueado.

Producción: **https://matchprop.vercel.app**
Repo: `git@github.com:matilonardi/matchprop.git`
Local: `/Users/matias.lonardi/matchprop`

---

## Stack
- **Framework:** Next.js 16 App Router (Turbopack) — `src/app/`
- **DB + Auth:** Supabase (proyecto `aqndahpjtkjgmwyltruy`)
- **Emails:** Resend (`alertas@matchprop.com.ar`)
- **Pagos:** MercadoPago (créditos para brokers)
- **AI matching:** OpenAI embeddings (`text-embedding-3-small`)
- **UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Vercel (auto-deploy desde `main`)

---

## Estado actual (junio 2025) — MVP en producción

### Páginas públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/pedidos` | Feed de búsquedas activas con filtros |
| `/pedidos/[id]` | Detalle + desbloqueo de contacto |
| `/publicar` | Wizard para que compradores publiquen su búsqueda |
| `/terminos`, `/privacidad` | Legal |

### Brokers
| Ruta | Descripción |
|------|-------------|
| `/broker` | Registro / login |
| `/broker/dashboard` | Dashboard con market intelligence (heatmap, FOMO widget) |
| `/broker/creditos` | Compra de créditos con MercadoPago |

### API routes
| Endpoint | Descripción |
|----------|-------------|
| `POST /api/pedidos` | Crea buyer_request (compradores) |
| `GET /api/pedidos` | Lista con filtros (zonas, tipo, presupuesto, dormitorios, pago, fecha, etc.) |
| `POST /api/broker/register` | Registro de broker + email bienvenida + email admin |
| `POST /api/broker/login` | Login de broker |
| `GET /api/broker/market-stats` | Stats de mercado para dashboard (heatmap, FOMO) |
| `POST /api/leads/unlock` | Broker desbloquea contacto (gasta 1 crédito) |
| `POST /api/matching` | AI matching: embeddings + alerta por email a brokers |
| `POST /api/mercadopago/create-preference` | Crea preferencia de pago MP |
| `GET /api/admin/stats` | Stats admin (protegido por ADMIN_SECRET) |

### Admin dashboard
Acceso: `https://matchprop.vercel.app/admin?key=<ADMIN_SECRET>`
- Tab Publicaciones: todos los pedidos, con opción de eliminar
- Tab Brokers: lista con créditos, leads desbloqueados, revenue estimado
- Tab Compradores: cuentas registradas

---

## Base de datos (Supabase)

### Tablas principales
```
buyer_requests      — búsquedas publicadas por compradores
broker_profiles     — perfil del broker (user_id, zones[], credits, specialty)
buyer_profiles      — perfil del comprador
lead_purchases      — registro de desbloqueos (broker_id, request_id, credits_spent)
broker_matches      — AI matching results
```

### buyer_requests columnas clave
`id, request_type ('property'|'car'), property_types[], zones[], bedrooms_min, bedrooms_max, bathrooms_min, budget_usd, financing, financing_types[], contact_name, contact_phone, contact_email, publisher_type, agency_name, status ('active'|'closed'), created_at`

### broker_profiles columnas clave
`id, user_id, name, agency_name, email, phone, zones[], credits, specialty ('propiedades'|'vehiculos'|'ambos')`

### Migraciones en `/supabase/migrations/`
- `001_initial.sql` — schema base
- `002` a `005` — extensiones incrementales
- `006_broker_specialty.sql` — columna specialty en broker_profiles (**ya aplicada en prod**)

---

## Variables de entorno (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
MP_ACCESS_TOKEN
MP_PUBLIC_KEY
NEXT_PUBLIC_HCAPTCHA_SITEKEY
HCAPTCHA_SECRET
TELEGRAM_BOT_TOKEN
NEXT_PUBLIC_APP_URL
CRON_SECRET
ADMIN_SECRET          ← para acceder a /admin
ADMIN_EMAIL           ← recibe alertas de nuevos brokers y pedidos
```

---

## Constantes importantes (`src/lib/constants.ts`)
- `ZONES_CORDOBA` — 261 barrios/zonas de Córdoba, ordenados alfabéticamente (español)
- `PROPERTY_TYPE_LABELS` — mapa de tipos de propiedad a labels en español
- `FINANCING_LABELS` — mapa de formas de pago
- `CAR_BRANDS`, `CAR_BODY_STYLE_LABELS`, `CAR_FUEL_TYPES`, `CAR_TRANSMISSION_OPTIONS` — para el feed de autos

---

## Funcionalidades destacadas

### Market intelligence en broker dashboard
El dashboard muestra:
- Oportunidades en sus zonas (pedidos no desbloqueados = FOMO)
- Heatmap de zonas con más demanda
- Ticket promedio y tipo más buscado
- Pedidos nuevos esta semana

API: `GET /api/broker/market-stats?broker_id=XXX&zones=Zona1,Zona2`

### AI matching
Cuando se publica un pedido: se genera embedding con OpenAI, se buscan brokers con zonas compatibles, se envía email de alerta.

### Filtros del feed de pedidos (propiedades)
Zona · Tipo · Dormitorios (🛏 1+/2+/3+/4+) · Desde USD · Hasta USD · Pago · Publica · Fecha · Ordenar

---

## Datos seed
- **68 pedidos** cargados desde mensajes de WhatsApp de grupo de brokers vía `scripts/seed_pedidos.js`
- Todos `publisher_type: 'inmobiliaria'`, `request_type: 'property'`

---

## Comandos útiles
```bash
npm run dev          # servidor local en :3000
git push origin main # deploy automático a Vercel
node scripts/seed_pedidos.js  # re-seed de pedidos (requiere .env.local)
```

---

## Flujo de negocio
1. Comprador entra → completa wizard → se crea `buyer_request`
2. Sistema hace AI matching → envía email a brokers con zonas compatibles
3. Broker recibe email → entra al dashboard → ve oportunidades
4. Broker usa 1 crédito → desbloquea contacto → se crea `lead_purchase`
5. Si broker no tiene créditos → va a `/broker/creditos` → compra con MercadoPago

## Modelo de créditos
- Registro: 2 créditos gratis
- Pack básico: ~USD 25 · Pack pro: ~USD 80 · Pack agencia: ~USD 150
- 1 crédito = 1 contacto desbloqueado

---

## Próximos pasos sugeridos
- Sistema de notificaciones push / Telegram para brokers
- Panel de métricas más avanzado
- Renovación/expiración de pedidos (60 días)
- Wizard de publicación para autos más detallado
- SEO: páginas estáticas por zona
