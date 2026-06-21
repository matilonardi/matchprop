import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'matchprop-admin-2025'

function auth(req: NextRequest): boolean {
  return req.headers.get('x-admin-secret') === ADMIN_SECRET
}

export async function GET(request: NextRequest) {
  if (!auth(request)) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('request_reports')
    .select('id, reason, status, created_at, request_id, broker_id')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ reports: data })
}

// PATCH /api/admin/reports?report_id=X&action=dismiss|close_request
export async function PATCH(request: NextRequest) {
  if (!auth(request)) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { report_id, action } = await request.json()
  if (!report_id || !['dismiss', 'close_request'].includes(action)) {
    return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: report } = await supabase
    .from('request_reports')
    .select('request_id')
    .eq('id', report_id)
    .single()

  if (!report) return Response.json({ error: 'Reporte no encontrado' }, { status: 404 })

  if (action === 'close_request') {
    await supabase
      .from('buyer_requests')
      .update({ status: 'closed' })
      .eq('id', report.request_id)

    await supabase
      .from('request_reports')
      .update({ status: 'reviewed' })
      .eq('request_id', report.request_id)
  } else {
    await supabase
      .from('request_reports')
      .update({ status: 'dismissed' })
      .eq('id', report_id)
  }

  return Response.json({ ok: true })
}
