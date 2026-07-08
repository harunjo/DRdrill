// Best-effort per-IP rate limit for the paid narrative endpoint. Pure over an
// injected store + clock so it's unit-testable; the route owns the module-level
// Map, which Fluid Compute keeps alive across requests on a warm instance.
// ponytail: not shared across all instances — best-effort throttle, backstopped
// by the provider spend cap. Move to a shared store (Upstash/KV) only if true
// cross-instance limits ever matter.

export interface RateEntry {
  count: number;
  resetAt: number;
}

/** Fixed-window counter. Returns true if this hit is within `limit` for the
 *  current window, false once the IP exceeds it. Mutates `store`. */
export function rateLimitOk(
  store: Map<string, RateEntry>,
  ip: string,
  now: number,
  limit: number,
  windowMs: number,
): boolean {
  // Opportunistic sweep so a long-lived instance's map can't grow unbounded.
  if (store.size > 5_000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }
  const entry = store.get(ip);
  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
