import { timingSafeEqual } from 'crypto'

/**
 * Verifies a caller-supplied admin secret against process.env.ADMIN_SECRET.
 *
 * Fails closed: if ADMIN_SECRET isn't configured in the environment, this
 * always returns false instead of falling back to a hardcoded default.
 * A hardcoded fallback would mean anyone reading the (public) repo knows
 * the real admin secret for any deploy that's missing the env var.
 *
 * Uses a constant-time comparison so response timing can't be used to
 * brute-force the secret one byte at a time.
 */
export function verifyAdminSecret(provided: string | null | undefined): boolean {
  const expected = process.env.ADMIN_SECRET
  if (!expected || !provided) return false

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false

  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
