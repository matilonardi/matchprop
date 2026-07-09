'use client'

import React, { useEffect, useRef, useState } from 'react'

type Variant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale-up' | 'fade'

interface Props {
  children: React.ReactNode
  className?: string
  variant?: Variant
  delay?: number
  threshold?: number
  as?: 'div' | 'section' | 'article' | 'li' | 'span' | 'p' | 'ul'
}

export default function AnimateIn({
  children,
  className = '',
  variant = 'fade-up',
  delay = 0,
  threshold = 0.12,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Degradación elegante: si el usuario prefiere menos movimiento o el
    // navegador no soporta IntersectionObserver, mostramos el contenido ya.
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)

    // Failsafe: si el observer nunca dispara (p. ej. pestaña en segundo plano,
    // renderer sin composición) pero el elemento ya está en viewport, revelarlo
    // igual para que el contenido nunca quede oculto. No afecta el scroll-reveal
    // de secciones fuera de pantalla.
    const failsafe = setTimeout(() => {
      const r = el.getBoundingClientRect()
      if (r.top < (window.innerHeight || 0) && r.bottom > 0) {
        setVisible(true)
        observer.disconnect()
      }
    }, 1600)

    return () => {
      observer.disconnect()
      clearTimeout(failsafe)
    }
  }, [threshold])

  const variants: Record<Variant, { hidden: string; show: string }> = {
    'fade-up':    { hidden: 'opacity-0 translate-y-10',  show: 'opacity-100 translate-y-0' },
    'fade-left':  { hidden: 'opacity-0 -translate-x-10', show: 'opacity-100 translate-x-0' },
    'fade-right': { hidden: 'opacity-0 translate-x-10',  show: 'opacity-100 translate-x-0' },
    'scale-up':   { hidden: 'opacity-0 scale-95',        show: 'opacity-100 scale-100' },
    'fade':       { hidden: 'opacity-0',                 show: 'opacity-100' },
  }

  const { hidden, show } = variants[variant]

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? show : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
