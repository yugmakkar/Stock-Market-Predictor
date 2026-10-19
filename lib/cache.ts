// Tiny in-memory TTL cache. Lives for the lifetime of the server process and is
// shared across requests, so repeated loads of the same symbol within the TTL
// make a single upstream call — this is what actually protects against Yahoo
// rate limits (Next's fetch cache is bypassed by `force-dynamic` routes).

interface Entry<T> {
  value: Promise<T>
  expires: number
}

const store = new Map<string, Entry<unknown>>()

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = store.get(key) as Entry<T> | undefined
  if (hit && hit.expires > now) {
    return hit.value
  }
  const value = fn()
  store.set(key, { value, expires: now + ttlMs })
  try {
    return await value
  } catch (err) {
    // Don't cache failures — allow an immediate retry.
    store.delete(key)
    throw err
  }
}

/** Test helper. */
export function clearCache(): void {
  store.clear()
}
