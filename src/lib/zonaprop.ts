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

export interface ZonaPropParams {
  property_types: string[]
  zones: string[]
  budget_usd?: number | null
  bedrooms_min?: number | null
}

/**
 * Build a ZonaProp search URL.
 * Pattern: /{types}-venta-{zone1}-{zone2}-...-{price}-dolar-{bedrooms}-habitaciones.html
 * All zones are included so multi-zone requests search across all neighborhoods.
 */
export function buildZonaPropUrl(req: ZonaPropParams): string {
  const base = 'https://www.zonaprop.com.ar'

  // ── Property types ──────────────────────────────────────────────────────────
  const typeSlugs = (req.property_types ?? [])
    .map(t => TYPE_TO_ZONAPROP[t])
    .filter(Boolean)
  const typeSegment = typeSlugs.length > 0 ? typeSlugs.join('-') : 'inmuebles'

  // ── All zones joined — ZonaProp supports multiple neighborhoods in the path ─
  const zonesSegment = (req.zones ?? [])
    .map(z => slugify(z))
    .filter(Boolean)
    .join('-') || 'cordoba'

  // ── Optional filter segments ────────────────────────────────────────────────
  const parts: string[] = []

  if (req.budget_usd) parts.push(`0-${req.budget_usd}-dolar`)
  if (req.bedrooms_min) parts.push(`${req.bedrooms_min}-habitaciones`)

  const filterSegment = parts.length > 0 ? `-${parts.join('-')}` : ''

  return `${base}/${typeSegment}-venta-${zonesSegment}${filterSegment}.html`
}
