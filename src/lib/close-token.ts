import { createHmac, timingSafeEqual } from 'crypto'

/**
 * HMAC secret for buyer "close request" / "reply" links sent by email.
 *
 * Prefers a dedicated CLOSE_TOKEN_SECRET; falls back to
 * SUPABASE_SERVICE_ROLE_KEY only because that's already a high-entropy
 * value that's never exposed to the client — NOT because it's the right
 * long-term choice (reusing a DB credential for an unrelated HMAC mixes
 * trust domains). TODO: set a dedicated CLOSE_TOKEN_SECRET in Vercel and
 * drop the service-role fallback.
 *
 * Never falls back to a hardcoded string: a missing env var must fail
 * closed (every token becomes invalid) rather than produce a predictable
 * token that's the same across every deploy that forgot to set the var.
 */
function getSecret(): string {
  const secret = process.env.CLOSE_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('[close-token] Missing CLOSE_TOKEN_SECRET / SUPABASE_SERVICE_ROLE_KEY env var')
  }
  return secret
}

export function makeCloseToken(requestId: string): string {
  return createHmac('sha256', getSecret()).update(requestId).digest('hex').slice(0, 32)
}

export function verifyCloseToken(requestId: string, token: string): boolean {
  let expected: string
  try {
    expected = makeCloseToken(requestId)
  } catch (e) {
    console.error('[close-token] verify failed:', e)
    return false
  }
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    // Buffer.from throws / timingSafeEqual throws on length mismatch —
    // either way, an invalid token.
    return false
  }
}
