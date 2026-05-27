import { createServerClient } from '@/lib/supabase-server'

// Lightweight ping endpoint — called by Vercel Cron every 3 days
// to prevent Supabase free tier from pausing the project due to inactivity.
export async function GET(request: Request) {
  // Verify it's called by Vercel Cron (has the auth header) or internally
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    // Minimal query — just counts active requests, uses an index
    const { count, error } = await supabase
      .from('buyer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (error) throw error

    return Response.json({
      ok: true,
      active_requests: count ?? 0,
      pinged_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[health] ping failed:', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
