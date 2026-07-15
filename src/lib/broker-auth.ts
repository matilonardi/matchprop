import { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolves the broker_profiles.id for the caller.
 *
 * Identity is verified via the Supabase access token sent in the
 * `Authorization: Bearer <token>` header — never trust a client-supplied
 * user id / broker id in the request body or query string, since those can
 * be set to any value by the caller (IDOR).
 *
 * Returns null if the token is missing, invalid/expired, or has no matching
 * broker_profiles row.
 */
export async function getAuthenticatedBroker(
  supabase: SupabaseClient,
  request: NextRequest
): Promise<{ brokerId: string; userId: string } | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  const { data: broker, error: brokerError } = await supabase
    .from('broker_profiles')
    .select('id')
    .eq('user_id', data.user.id)
    .single()

  if (brokerError || !broker) return null
  return { brokerId: broker.id, userId: data.user.id }
}
