import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyCloseToken } from '@/lib/close-token'

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

  if (!verifyCloseToken(id, close_token)) {
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
