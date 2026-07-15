const DEFAULT_APP_URL = 'https://matchprop.vercel.app'
const MATCHING_TIMEOUT_MS = 8_000

/**
 * Fires the AI matching job for a newly created request.
 *
 * Non-blocking by design — callers don't await this — but:
 * - failures are logged (with the source + request id) instead of silently
 *   swallowed via `.catch(() => {})`, so a broken /api/matching doesn't fail
 *   invisibly with brokers simply never getting alerted.
 * - the call is bounded by a timeout so a hung request can't leak an
 *   unbounded fetch/lambda invocation per new pedido.
 */
export function triggerMatching(requestId: string, source: string): void {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), MATCHING_TIMEOUT_MS)

  fetch(`${appUrl}/api/matching`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId }),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) {
        console.error(`[${source}] matching request failed:`, res.status, requestId)
      }
    })
    .catch((e) => {
      const cause = e?.name === 'AbortError' ? 'timeout' : e
      console.error(`[${source}] matching request errored:`, cause, requestId)
    })
    .finally(() => clearTimeout(timeout))
}
