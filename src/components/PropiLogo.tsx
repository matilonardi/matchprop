// Propi — Logo SVG
// Ícono: cuadrado naranja redondeado con pin de ubicación blanco
// Wordmark: "prop" slate oscuro + "i" naranja

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
      {/* Fondo: cuadrado naranja redondeado */}
      <rect width="32" height="32" rx="8" fill="#f97316" />

      {/* Pin de ubicación blanco */}
      <path
        d="M16 6C12.134 6 9 9.134 9 13C9 17.418 13.5 22.5 15.4 24.6C15.73 24.97 16.27 24.97 16.6 24.6C18.5 22.5 23 17.418 23 13C23 9.134 19.866 6 16 6Z"
        fill="white"
      />

      {/* Punto interior del pin (naranja — el "i" de Propi) */}
      <circle cx="16" cy="13" r="3" fill="#f97316" />
    </svg>
  )
}

export function PropiLogoFull({
  className = '',
  iconSize = 28,
  textSize = 'text-xl',
}: {
  className?: string
  iconSize?: number
  textSize?: string
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <PropiIcon size={iconSize} />
      <span className={`${textSize} font-bold tracking-tight`}>
        <span className="text-gray-900">prop</span>
        <span className="text-orange-500">i</span>
      </span>
    </span>
  )
}
