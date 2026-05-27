import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createHmac, timingSafeEqual } from 'crypto'

function makeCloseToken(requestId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createHmac('sha256', secret).update(requestId).digest('hex').slice(0, 32)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { close_token, close_reason } = body

  if (!close_token) {
    return Response.json({ error: 'Token requerido' }, { status: 400 })
  }

  // Verify token using timing-safe comparison
  const expected = makeCloseToken(id)
  let valid = false
  try {
    valid = timingSafeEqual(Buffer.from(close_token), Buffer.from(expected))
  } catch {
    valid = false
  }

  if (!valid) {
    return Response.json({ error: 'Token inválido' }, { status: 403 })
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('buyer_requests')
    .update({
      status: 'closed',
      close_reason: close_reason || null,
    })
    .eq('id', id)
    .eq('status', 'active') // Only close active requests

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
