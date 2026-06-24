import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createHmac } from 'crypto'

const VALID_OUTCOMES = ['nada', 'envie_opciones', 'hubo_visita', 'hubo_negociacion', 'hubo_reserva', 'hubo_venta']

function makeToken(leadId: string, outcome: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'secret'
  return createHmac('sha256', secret).update(`${leadId}:${outcome}`).digest('hex').slice(0, 32)
}

// POST — from dashboard modal (authenticated broker, no token needed)
export async function POST(request: NextRequest) {
  const { lead_id, outcome } = await request.json()

  if (!lead_id || !outcome) return Response.json({ error: 'lead_id y outcome requeridos' }, { status: 400 })
  if (!VALID_OUTCOMES.includes(outcome)) return Response.json({ error: 'outcome inválido' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase
    .from('lead_purchases')
    .update({ outcome, outcome_at: new Date().toISOString() })
    .eq('id', lead_id)
    .is('outcome', null)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

// GET — from email link (token-based, no login required)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('lid') || ''
  const outcome = searchParams.get('outcome') || ''
  const token = searchParams.get('token') || ''

  if (!leadId || !outcome || !token) return new Response('Parámetros inválidos', { status: 400 })
  if (!VALID_OUTCOMES.includes(outcome)) return new Response('Resultado inválido', { status: 400 })
  if (token !== makeToken(leadId, outcome)) return new Response('Token inválido', { status: 403 })

  const supabase = createServerClient()
  await supabase
    .from('lead_purchases')
    .update({ outcome, outcome_at: new Date().toISOString() })
    .eq('id', leadId)
    .is('outcome', null)

  // Redirect to a thank-you page
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://matchprop.vercel.app').replace(/\/$/, '')
  return Response.redirect(`${appUrl}/broker/dashboard?survey_ok=1`, 302)
}

export { makeToken }
