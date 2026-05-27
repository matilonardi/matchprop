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
    return () => observer.disconnect()
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
