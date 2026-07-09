import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const VALID = ['instant', 'daily', 'weekly', 'off']

// GET — preferencia actual del broker
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId requerido' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('broker_profiles')
    .select('alert_frequency')
    .eq('user_id', userId)
    .single()

  if (error || !data) return Response.json({ error: 'Broker no encontrado' }, { status: 404 })
  return Response.json({ alert_frequency: data.alert_frequency || 'instant' })
}

// POST — actualizar preferencia { userId, frequency }
export async function POST(request: NextRequest) {
  const { userId, frequency } = await request.json()
  if (!userId || !VALID.includes(frequency)) {
    return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('broker_profiles')
    .update({ alert_frequency: frequency })
    .eq('user_id', userId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, alert_frequency: frequency })
}
