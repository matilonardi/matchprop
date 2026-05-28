import type { PublicBuyerRequest } from './supabase'

/** Remove accents and slugify a string for use in ZonaProp URLs */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accent marks (é→e, ó→o …)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const TYPE_TO_ZONAPROP: Record<string, string> = {
  casa: 'casas',
  departamento: 'departamentos',
  ph: 'ph',
  duplex: 'duplex',
  terreno: 'terrenos',
  local: 'locales',
}

/**
 * Build a ZonaProp search URL from a MatchProp buyer request.
 * URL pattern: /{types}-venta-{location}-{price}-dolar-{bedrooms}-habitaciones.html
 */
export function buildZonaPropUrl(request: PublicBuyerRequest): string {
  const base = 'https://www.zonaprop.com.ar'

  // ── Property types ──────────────────────────────────────────────────────────
  const typeSlugs = (request.property_types ?? [])
    .map(t => TYPE_TO_ZONAPROP[t])
    .filter(Boolean)
  const typeSegment = typeSlugs.length > 0 ? typeSlugs.join('-') : 'inmuebles'

  // ── Location — use first zone (most specific) ───────────────────────────────
  const zoneSlug = slugify(request.zones?.[0] ?? 'cordoba')

  // ── Optional filter segments ────────────────────────────────────────────────
  const parts: string[] = []

  // Price ceiling in USD (ZonaProp format: "0-{max}-dolar")
  if (request.budget_usd) {
    parts.push(`0-${request.budget_usd}-dolar`)
  }

  // Minimum bedrooms
  if (request.bedrooms_min) {
    parts.push(`${request.bedrooms_min}-habitaciones`)
  }

  const filterSegment = parts.length > 0 ? `-${parts.join('-')}` : ''

  return `${base}/${typeSegment}-venta-${zoneSlug}${filterSegment}.html`
}
