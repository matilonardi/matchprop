import { createServerClient } from '@/lib/supabase-server'

// Readiness check for the Supabase dependency — called by Vercel Cron every
// 3 days both to prevent the free-tier project from pausing due to
// inactivity, AND to verify the app can actually reach its database.
//
// Semantics: this is a READINESS probe (can we serve real traffic right
// now?), not a liveness probe (is the process up?) — those are different
// questions and this endpoint only answers the first one. A 503 here means
// "Supabase is unreachable," which is a real degraded state, not a generic
// app bug — hence 503 (Service Unavailable) rather than 500.
export async function GET(request: Request) {
  // Verify it's called by Vercel Cron (has the auth header) or internally
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    // Minimal query — just counts active requests, uses an index.
    // Bounded by the global Supabase fetch timeout (see lib/supabase-server.ts),
    // so a hung DB connection fails this check instead of hanging the cron run.
    const { count, error } = await supabase
      .from('buyer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (error) throw error

    return Response.json({
      ok: true,
      dependency: 'supabase',
      active_requests: count ?? 0,
      checked_at: new Date().toISOString(),
    })
  } catch (err) {
    // Log as an actionable dependency failure (name + cause), not a bare stack trace.
    console.error('[health] supabase dependency check failed:', err)
    return Response.json(
      { ok: false, dependency: 'supabase', error: String(err), checked_at: new Date().toISOString() },
      { status: 503 }
    )
  }
}
