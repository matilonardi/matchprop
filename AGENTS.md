<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Demandi — Contexto del proyecto

## ¿Qué es?
Marketplace inmobiliario de **demanda inversa** para Córdoba, Argentina.
- **Compradores** publican gratis lo que buscan (propiedad o auto).
- **Brokers** ven el contacto del comprador (actualmente gratis, créditos desactivados en UI).
- Modelo futuro: compradores gratis · brokers pagan 1 crédito por contacto desbloqueado.

Producción: **https://matchprop.vercel.app** (URL activa · `demandi.com.ar` en trámite en NIC.ar)
Repo: `git@github.com:matilonardi/matchprop.git`
Local: `/Users/matias.lonardi/matchprop`

---

## Stack
- **Framework:** Next.js 16 App Router (Turbopack) — `src/app/`
- **DB + Auth:** Supabase (proyecto `aqndahpjtkjgmwyltruy`)
- **Emails:** Resend (`alertas@matchprop.com.ar`)
- **Pagos:** MercadoPago — tokens de producción `APP_USR-` configurados en Vercel (desactivado en UI por ahora)
- **AI matching:** OpenAI embeddings (`text-embedding-3-small`)
- **UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Vercel (auto-deploy desde `main`)

---

## Estado actual (junio 2026) — MVP en producción

### Páginas públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page (sin sección de precios — etapa gratuita) |
| `/pedidos` | Feed de búsquedas activas con filtros |
| `/pedidos/[id]` | Detalle + desbloqueo de contacto + botón Reportar (visible a todos) |
| `/publicar` | Wizard para que compradores publiquen su búsqueda |
| `/terminos`, `/privacidad` | Legal |

### Brokers
| Ruta | Descripción |
|------|-------------|
| `/broker` | Registro / login |
| `/broker/dashboard` | Dashboard con market intelligence (heatmap, FOMO widget) |
| `/broker/creditos` | Página informativa "Créditos gratis por ahora" (compra desactivada) |

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
| `POST /api/pedidos/[id]/report` | Reportar pedido — anónimo o con broker_user_id (ambos soportados) |
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
request_reports     — reportes de pedidos (broker_id nullable — acepta anónimos)
```

### buyer_requests columnas clave
`id, request_type ('property'|'car'), property_types[], zones[], bedrooms_min, bedrooms_max, bathrooms_min, budget_usd, financing, financing_types[], contact_name, contact_phone, contact_email, publisher_type, agency_name, status ('active'|'closed'), created_at`

Valores válidos:
- `property_types`: `'departamento'`, `'casa'`, `'duplex'`, `'terreno'`, etc. (en español, no en inglés)
- `financing`: `'efectivo'`, `'credito'`, `'ambos'`
- `financing_types`: array con los mismos valores

### broker_profiles columnas clave
`id, user_id, name, agency_name, email, phone, zones[], credits, specialty ('propiedades'|'vehiculos'|'ambos')`

### Migraciones en `/supabase/migrations/`
- `002` a `005` — schema base + extensiones
- `006_broker_specialty.sql` — columna specialty en broker_profiles (aplicada en prod)
- `007_operation_type.sql`, `007_publisher_type.sql` — tipos de operación y publicador
- `008_request_reports.sql` — tabla request_reports (broker_id nullable)
- `009_enable_rls.sql` — Row Level Security
- `010_featured_requests.sql`, `011_lead_outcomes.sql` — features adicionales

---

## Variables de entorno (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
MP_ACCESS_TOKEN          ← producción: empieza con APP_USR-
MP_PUBLIC_KEY            ← producción: empieza con APP_USR-
NEXT_PUBLIC_HCAPTCHA_SITEKEY
HCAPTCHA_SECRET
TELEGRAM_BOT_TOKEN
NEXT_PUBLIC_APP_URL
CRON_SECRET
ADMIN_SECRET             ← para acceder a /admin
ADMIN_EMAIL              ← recibe alertas de nuevos brokers y pedidos
```

---

## Constantes importantes (`src/lib/constants.ts`)
- `ZONAS_CORDOBA` — 7 macro-zonas (Centro, Norte, Sur, Este, Oeste, Nueva Córdoba, etc.) — usado en filtro "📍 Zona"
- `ZONES_CORDOBA` — 261 barrios específicos de Córdoba, ordenados alfabéticamente — usado en filtro "🏘️ Barrio"
- `PROPERTY_TYPE_LABELS` — mapa de tipos de propiedad a labels en español
- `FINANCING_LABELS` — mapa de formas de pago
- `CAR_BRANDS`, `CAR_BODY_STYLE_LABELS`, `CAR_FUEL_TYPES`, `CAR_TRANSMISSION_OPTIONS` — para el feed de autos

---

## Funcionalidades destacadas

### Filtros del feed (`src/app/pedidos/PedidosFeed.tsx`)
- **📍 Zona** — 7 macro-zonas de `ZONAS_CORDOBA`
- **🏘️ Barrio** — 261 barrios de `ZONES_CORDOBA` con buscador
- **Tipo, Dormitorios, Desde/Hasta USD, Pago, Publica, Fecha, Ordenar**
- Los filtros multi-select (Zona, Barrio, Tipo) usan **estado pendiente**: los checkboxes modifican estado local y el fetch se dispara solo al cerrar el dropdown (click fuera).
- Paginación con páginas numeradas, elipsis y campo "Ir a página".

### Reportar publicación
- Botón "Reportar este pedido" visible para **todos los visitantes** (no requiere login).
- API `POST /api/pedidos/[id]/report` acepta `broker_user_id` opcional; si no se provee, `broker_id` queda `null`.
- Razones válidas: `vendida`, `contacto_incorrecto`, `falso`, `cliente_encontro`, `otro`.

### Market intelligence en broker dashboard
El dashboard muestra:
- Oportunidades en sus zonas (pedidos no desbloqueados = FOMO)
- Heatmap de zonas con más demanda
- Ticket promedio y tipo más buscado
- Pedidos nuevos esta semana

API: `GET /api/broker/market-stats?broker_id=XXX&zones=Zona1,Zona2`

### AI matching
Cuando se publica un pedido: se genera embedding con OpenAI, se buscan brokers con zonas compatibles, se envía email de alerta.

---

## WhatsApp Bot (`/bot/`)
Parsea mensajes de grupos de WhatsApp de brokers y crea pedidos en Supabase.

```bash
cd /Users/matias.lonardi/matchprop/bot
node index.js   # ← SIEMPRE correr así (carga dotenv). NUNCA correr parser.js directamente.
```

- **Cooldown:** 60 min entre corridas, controlado por `last_run.json` (`{"timestamp": <ms>}`).
  - Para saltear: `echo '{"timestamp":'$(( $(date +%s) * 1000 - 7200000 ))'}' > last_run.json`
- **Modelo LLM:** `llama-3.1-8b-instant` (Groq)
- **Regla de datos:** Solo carga pedidos reales de los grupos. Nunca pedidos de ejemplo.
- **Si browser ya está corriendo:** `pkill -f "chrome.*matchprop"` y volver a correr.

---

## Modelo de créditos (estado actual)
- **UI de compra desactivada** — en etapa inicial los créditos son gratuitos.
- `/broker/creditos` muestra "Créditos gratis por ahora" con link al dashboard.
- La landing page no muestra la sección de precios.
- El botón "Comprar créditos" fue removido del dashboard.
- El backend y la lógica de créditos siguen intactos para cuando se reactive.
- Registro otorga 2 créditos gratis (sin cambios).

---

## Comandos útiles
```bash
npm run dev           # servidor local en :3000
git push origin main  # deploy automático a Vercel
```

---

## Flujo de negocio
1. Comprador entra → completa wizard → se crea `buyer_request`
2. Sistema hace AI matching → envía email a brokers con zonas compatibles
3. Broker recibe email → entra al dashboard → ve oportunidades
4. Broker usa 1 crédito → desbloquea contacto → se crea `lead_purchase`

## Pendiente
- Configurar dominio `demandi.com.ar` (en trámite en NIC.ar): A record `76.76.21.21` → agregar en Vercel Domains → actualizar `NEXT_PUBLIC_APP_URL=https://demandi.com.ar`
- Reactivar cobro de créditos cuando el producto esté más maduro
