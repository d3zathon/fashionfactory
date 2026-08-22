/**
 * A small in-process sliding-window rate limiter.
 *
 * Deliberately dependency-free and stateless-on-disk: it holds timestamps in
 * module memory, which on Vercel means per serverless instance. That is a real
 * limitation and worth being honest about — a determined flooder spread across
 * many cold starts gets more than `limit` requests through, and the counter
 * resets whenever an instance is recycled.
 *
 * It is still worth having. What actually hits a small shop's contact form is
 * one script hammering one endpoint from one address, and that is exactly the
 * case a per-instance window stops, at zero cost and with no external service
 * to sign up for, pay for, or leak a token from.
 *
 * If this ever needs to hold across instances, the shape below is the same one
 * @upstash/ratelimit exposes, so swapping the body for a Redis call is a local
 * change — see docs/DEPLOYMENT.md.
 */

interface Bucket {
  hits: number[];
  /** Newest hit, used to expire idle buckets without scanning every timestamp. */
  last: number;
}

const buckets = new Map<string, Bucket>();

// Bounds memory on a long-lived instance. Well above any legitimate traffic
// this endpoint sees, and pruning is O(n) only when the ceiling is reached.
const MAX_TRACKED_KEYS = 5_000;

function prune(now: number, windowMs: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.last > windowMs) buckets.delete(key);
  }
  // Still oversized after dropping idle keys (an active flood from many
  // addresses): drop the coldest half rather than grow without limit.
  if (buckets.size > MAX_TRACKED_KEYS) {
    const byAge = [...buckets.entries()].sort((a, b) => a[1].last - b[1].last);
    for (const [key] of byAge.slice(0, Math.floor(byAge.length / 2))) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry. Zero when `ok`. */
  retryAfter: number;
  remaining: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > MAX_TRACKED_KEYS) prune(now, windowMs);

  const bucket = buckets.get(key) ?? { hits: [], last: now };
  const cutoff = now - windowMs;
  const hits = bucket.hits.filter((at) => at > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, { hits, last: now });
    const oldest = hits[0];
    return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)), remaining: 0 };
  }

  hits.push(now);
  buckets.set(key, { hits, last: now });
  return { ok: true, retryAfter: 0, remaining: limit - hits.length };
}

/**
 * Best-effort client address.
 *
 * On Vercel `x-forwarded-for` is set by the platform edge, and the leftmost
 * entry is the client. Behind an untrusted proxy this header is spoofable, so
 * it is a speed bump rather than an identity — which is all a rate limit key
 * needs to be. Falls back to a single shared bucket when there is no header,
 * so a misconfigured host is still limited rather than unlimited.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}
