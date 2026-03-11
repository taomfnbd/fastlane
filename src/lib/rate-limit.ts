// WARNING: In-memory rate limiting does NOT work reliably on serverless (Vercel).
// Each function invocation may get a fresh instance with an empty map.
// For production, migrate to Redis (e.g. @upstash/ratelimit) or Vercel KV.
const rateMap = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateMap) {
    if (entry.resetAt <= now) rateMap.delete(key);
  }
}

/**
 * Simple in-memory rate limiter.
 * Returns { allowed: true } or { allowed: false, retryAfter } (seconds).
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfter: number } {
  cleanup();
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || entry.resetAt <= now) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}
