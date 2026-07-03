'use client'

import { useEffect, useState } from 'react'

const TERMS = [
  'Casa en Mendiolaza',
  'Depto en Nueva Córdoba',
  'SUV 2020+',
  'Duplex en Villa Belgrano',
  'Local en el centro',
  'Lote en las sierras',
]

// Ticker del hero: rota el término cada 2.4s con un fade suave.
// Mejora progresiva: sin JS muestra el primer término estático.
export default function HeroTicker() {
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false)
      const swap = setTimeout(() => {
        setI((prev) => (prev + 1) % TERMS.length)
        setVisible(true)
      }, 300)
      return () => clearTimeout(swap)
    }, 2400)
    return () => clearInterval(cycle)
  }, [])

  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-3">
      <span
        className="relative flex h-[7px] w-[7px] shrink-0"
        aria-hidden="true"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-brand animate-radar" />
        <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-brand" />
      </span>
      Buscando ahora ·{' '}
      <span
        className="font-bold text-brand transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {TERMS[i]}
      </span>
    </span>
  )
}
