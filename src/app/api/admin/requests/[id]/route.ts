import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Verify admin secret
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'
  const providedSecret = request.headers.get('x-admin-secret')

  if (providedSecret !== ADMIN_SECRET) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await props.params

  if (!id) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('buyer_requests')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
