<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
---

# Demandi — Contexto del proyecto

## ¿Qué es?
Marketplace inmobiliario de **demanda inversa** para Córdoba, Argentina.
- **Compradores** publican gratis lo que buscan (propiedad).
- **Vendedores / inmobiliarias (brokers)** ven el contacto del comprador.
- Etapa actual: **beta gratuita** — ver contactos es sin costo (20 desbloqueos al registrarse). El modelo de créditos pago existe en el backend para reactivar más adelante.
- **Autos:** el soporte de vehículos sigue en el código/DB pero está **oculto de la UI** (el negocio es solo inmobiliario por ahora).

Producción: **https://demandi.com.ar** (dominio principal · `www.demandi.com.ar` redirige · `matchprop.vercel.app` sigue como alias)
Repo: `git@github.com:matilonardi/matchprop.git`
Local: `/Users/matias.lonardi/matchprop`
Proyecto Vercel: **demandi** (auto-deploy desde `main`)

---

## Stack
- **Framework:** Next.js 16 App Router (Turbopack) — `src/app/`
- **DB + Auth:** Supabase (proyecto `aqndahpjtkjgmwyltruy`)
- **Emails:** Resend — remitente **`@demandi.com.ar`** (alertas@ / noreply@)
- **Pagos:** MercadoPago — tokens de producción `APP_USR-` en Vercel (UI desactivada por ahora)
- **AI matching:** OpenAI embeddings (`text-embedding-3-small`)
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Deploy:** Vercel (auto-deploy desde `main`)

---

## Sistema de diseño (rediseño 2026)
Look editorial, plano, moderno — sin aspecto "generado por AI".
- **Fuentes:** Hanken Grotesk (todo) + Space Grotesk (números de paso/badges). Definidas en `layout.tsx`.
- **Color de marca:** verde `#2E8B58` (hover `#22693F`, tinte `#EEF6F0`). Tokens en `globals.css` (`--brand`, `--ink`, `--hairline`, `--tint`, `--surface`, `--field`, etc.).
- **Estilo:** hairlines `#E4E9E5` en vez de sombras, iconos de línea (lucide), **cero emojis** en la UI.
- ⚠️ **Turbopack cachea las CSS custom properties**: al editar tokens en `globals.css` hay que **reiniciar el dev server** (los cambios en componentes sí toman por HMR). Con `@theme inline`, `--color-*` no se emite como variable (es esperado).

---

## Dominio y DNS
- `demandi.com.ar` usa **nameservers de Vercel** (`ns1/ns2.vercel-dns.com`) → todo el DNS se maneja por Vercel (CLI: `vercel dns ...`).
- **Envío de emails (Resend):** registros en `send.demandi.com.ar` (DKIM `resend._domainkey`, SPF, MX a `feedback-smtp.sa-east-1.amazonses.com`) + DMARC.
- **Recepción / contacto:** `hola@demandi.com.ar` reenvía a `lonardimatias@gmail.com` vía **ForwardEmail** (MX `mx1/mx2.forwardemail.net` + TXT `forward-email=...` en la raíz). No hay casilla propia; todo cae en el Gmail.
- `NEXT_PUBLIC_APP_URL=https://demandi.com.ar`.

---

## Páginas
### Públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Landing — hero, ticker, stats, cómo funciona, **"Zonas con más demanda" (dinámico)**, para compradores/vendedores, CTA |
| `/pedidos` | Feed de búsquedas activas con filtros |
| `/pedidos/[id]` | Detalle + ver contacto (gratis en beta) + botón Reportar (visible a todos) |
| `/publicar` | Wizard 6 pasos para publicar una búsqueda |
| `/comprador/login`, `/comprador/dashboard` | Cuenta del comprador |
| `/terminos`, `/privacidad` | Legal (contacto: `hola@demandi.com.ar`) |

### Brokers
| Ruta | Descripción |
|------|-------------|
| `/broker` | Registro / login (layout editorial + card con tabs segmented) |
| `/broker/dashboard` | Market intelligence (zonas, ticket promedio, matches, FOMO) |
| `/broker/creditos` | "Créditos gratis por ahora" (compra desactivada) |

### Admin
`https://demandi.com.ar/admin` (protegido por `ADMIN_SECRET`) — tabs Pulso, Publicaciones, Brokers, Compradores, Reportes.

### API routes clave
`POST/GET /api/pedidos` · `POST /api/bot/pedido` (bot, con `x-bot-secret` + dedup por `source_message_id`) · `POST /api/buyer/register` · `POST /api/broker/register` (otorga **20 créditos**) · `POST /api/broker/pedidos` · `POST /api/pedidos/[id]/unlock` (gatea por créditos, 402 si <1) · `POST /api/pedidos/[id]/report` (email a lonardimatias@gmail.com) · `POST /api/matching` · `GET /api/health` (cron, protegido por `CRON_SECRET`).

---

## Base de datos (Supabase)

### Tablas
```
buyer_requests   — búsquedas publicadas (compradores + bot)
broker_profiles  — perfil broker (user_id, zones[], credits, specialty)
buyer_profiles   — perfil comprador
lead_purchases   — desbloqueos (broker_id, request_id, credits_spent)
broker_matches   — resultados de AI matching
request_reports  — reportes (broker_id nullable → acepta anónimos)
credit_transactions — compras de créditos (MP)
```

### buyer_requests — columnas clave
`id, request_type ('property'|'car'), operation_type ('compra'|'alquiler'), property_types[], zones[], bedrooms_min/max, bathrooms_min, budget_usd, budget_usd_min, budget_ars, budget_ars_min, financing, financing_types[], publisher_type ('particular'|'inmobiliaria'), agency_name, source_message_id, featured_until, contact_name/phone/email, status ('active'|'closed'|...), created_at`

- **Presupuesto:** `budget_usd`/`budget_ars` = tope ("Hasta"); `*_min` = "Desde" opcional (rango). Alquileres en ARS, compras en USD.
- `source_message_id`: ID del mensaje de WhatsApp — **índice único** que evita duplicados del bot.

### Migraciones (`/supabase/migrations/`)
`002`–`011` base + extensiones · `012_budget_ars` · `013_source_message_id` (dedup bot) · `014_budget_range` (`budget_usd_min`, `budget_ars_min`). Todas aplicadas en prod.

---

## Feed de pedidos (`src/app/pedidos/PedidosFeed.tsx`)
- Filtros: Zona (7 macro-zonas), Barrio (261, con buscador), Tipo, Operación, Dormitorios, **Presupuesto (rango USD/ARS Desde–Hasta)**, Pago, Publica, Fecha, Ordenar. Multi-select con estado pendiente (commit al cerrar dropdown).
- Tarjetas: icono de línea por tipo, precio tabular (muestra rango si hay "Desde"), **badge de operación con color: Alquiler ámbar / Compra verde**, chip **Particular / Inmobiliaria** visible, badge "Destacado", "Ver contacto".
- Paginación numerada con elipsis + "Ir a página".

## Wizard de publicar (`src/app/publicar/PublicarWizard.tsx`)
6 pasos (Tipo → Barrio → Dorm/baños → Presupuesto → Requisitos → Cuenta). Presupuesto = **rango Desde/Hasta** con validación (Hasta > Desde). Scroll al top al cambiar de paso. Sin campos de frente/fondo de terreno (removidos).

---

## WhatsApp Bot (`/bot/`)
Parsea mensajes de grupos de WhatsApp y crea pedidos en Supabase.

```bash
cd /Users/matias.lonardi/matchprop/bot
node index.js   # ← SIEMPRE así (carga dotenv). Nunca correr parser.js directo.
# Saltear ventana: echo '{"timestamp":'$(( $(date +%s) * 1000 - 7200000 ))'}' > last_run.json
# Si el browser quedó colgado: pkill -f "chrome.*matchprop"
```

- **Automatizado con launchd** (`~/Library/LaunchAgents/com.matchprop.bot.plist` → `bot/run_daily.sh`): dispara cada 1h; el wrapper filtra por día → **Lun-Vie cada 1h, Sáb-Dom cada 2h**. Requiere Mac prendida + sesión de WhatsApp Web activa.
- **Ventana de re-escaneo: 48h** (`MIN_LOOKBACK_HOURS`) para no perder mensajes si la Mac durmió.
- **`processed.json`:** cache de IDs ya vistos → re-escanear la ventana amplia sin re-parsear ni gastar tokens.
- **Dedup:** `source_message_id` (índice único en la DB) — inmune a la variación del parser LLM.
- **Saneamiento de presupuesto (determinístico):** alquiler con monto alto en USD → se reinterpreta como ARS; compra >3M USD (error de parseo) → "a convenir".
- **LLM:** `llama-3.1-8b-instant` (Groq). **Regla:** solo pedidos reales de los grupos, nunca ejemplos.
- Grupos monitoreados (`TARGET_GROUP_IDS`): NUEVA CBA Y G PAZ · Zona Norte Team · Zona Sur Team · Centro, Cofico, Alberdi.

---

## Modelo de créditos (beta)
- **Ver contactos es gratis** — 20 desbloqueos al registrarse; UI de compra desactivada.
- El desbloqueo descuenta 1 crédito (backend intacto para reactivar cobro).
- Landing sin sección de precios.

---

## Variables de entorno (`.env.local` / Vercel)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY` (Sensitive en Vercel — no se puede leer por CLI), `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `NEXT_PUBLIC_HCAPTCHA_SITEKEY`, `HCAPTCHA_SECRET`, `GROQ_API_KEY` (bot), `BOT_SECRET`, `TARGET_GROUP_IDS` (bot/.env), `NEXT_PUBLIC_APP_URL=https://demandi.com.ar`, `CRON_SECRET`, `ADMIN_SECRET`, `ADMIN_EMAIL`.

---

## Comandos útiles
```bash
npm run dev           # servidor local en :3000
npm run build         # verificar build antes de deploy
git push origin main  # deploy automático a Vercel
```

## Pendiente / ideas
- Reactivar cobro de créditos cuando el producto madure (backend listo).
- Destacados: función pausada (no hay pago de "Destacar" activo).
