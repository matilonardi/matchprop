'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// ── Auto-track pageviews on route change ─────────────────────
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname
      if (searchParams?.toString()) url += '?' + searchParams.toString()
      ph.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams, ph])

  return null
}

// ── Provider principal ────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,  // lo hacemos manualmente arriba
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,    // oculta campos de formulario en grabaciones
      },
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}

// ── Hook para trackear eventos desde cualquier componente ─────
export { usePostHog }
