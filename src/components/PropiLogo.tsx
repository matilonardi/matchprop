'use client'

// ─────────────────────────────────────────────────────────────
//  Demandi — Sistema de Logo
//
//  Concepto: el pin de ubicación reemplaza la letra "i"
//  El punto del pin = el punto de la i = donde querés vivir
//
//  Colores: #2E8B57 (verde esmeralda moderno)
// ─────────────────────────────────────────────────────────────

const BRAND_GREEN = '#2E8B57'

// ── Pin SVG (reemplaza la "i") ────────────────────────────────
function PinIcon({ height = 28 }: { height?: number }) {
  const w = Math.round(height * 0.65)
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 13 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'bottom', marginBottom: 1 }}
    >
      <path
        d="M6.5 0C2.91 0 0 2.91 0 6.5C0 11.375 6.5 20 6.5 20C6.5 20 13 11.375 13 6.5C13 2.91 10.09 0 6.5 0Z"
        fill={BRAND_GREEN}
      />
      <circle cx="6.5" cy="6.5" r="2.8" fill="white" />
    </svg>
  )
}

// ── Ícono cuadrado (favicon / app icon) ──────────────────────
export function PropiIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill={BRAND_GREEN} />
      <path
        d="M16 6C12.134 6 9 9.134 9 13C9 17.75 16 26 16 26C16 26 23 17.75 23 13C23 9.134 19.866 6 16 6Z"
        fill="white"
      />
      <circle cx="16" cy="13" r="3" fill="white" />
    </svg>
  )
}

// ── Logo completo: demand + pin-como-i ─────────────────────────
export function PropiLogoFull({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const config = {
    sm: { fontSize: 16, fontWeight: 800, pinH: 19, tracking: '-0.03em' },
    md: { fontSize: 22, fontWeight: 900, pinH: 26, tracking: '-0.04em' },
    lg: { fontSize: 30, fontWeight: 900, pinH: 35, tracking: '-0.04em' },
    xl: { fontSize: 44, fontWeight: 900, pinH: 52, tracking: '-0.05em' },
  }
  const c = config[size]

  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{ letterSpacing: c.tracking, lineHeight: 1 }}
    >
      <span
        style={{
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          color: BRAND_GREEN,
          fontFamily: 'inherit',
        }}
      >
        demand
      </span>
      <PinIcon height={c.pinH} />
    </span>
  )
}

// ── Logo con ícono cuadrado + wordmark (para hero / splash) ──
export function PropiLogoBrand({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PropiIcon size={42} />
      <div className="flex flex-col leading-none">
        <PropiLogoFull size="lg" />
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: '#94a3b8',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: 3,
          }}
        >
          Publicá lo que buscás
        </span>
      </div>
    </div>
  )
}
