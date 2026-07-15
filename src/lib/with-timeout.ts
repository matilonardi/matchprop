/**
 * Bounds how long we wait on a promise that has no timeout option of its
 * own (e.g. the Resend SDK's `.emails.send()`, which doesn't expose an
 * AbortSignal/timeout param). This doesn't cancel the underlying request,
 * but it stops our own request handler from hanging indefinitely if the
 * dependency never responds — which is what actually matters for not
 * holding a serverless function open forever.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`[timeout] ${label} exceeded ${ms}ms`)), ms)
    }),
  ])
}
