import { createClient } from '@supabase/supabase-js'

// Every Supabase call in this app goes through this factory, so a single
// bounded-timeout fetch here covers all of them. Without this, a slow/hung
// Supabase response has no deadline and can hold a Vercel function open
// for its entire max duration on every request that touches the DB.
const SUPABASE_TIMEOUT_MS = 10_000

function timeoutFetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
  const [url, init] = args
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS)
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout))
}

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: timeoutFetch,
      },
    }
  )
}
