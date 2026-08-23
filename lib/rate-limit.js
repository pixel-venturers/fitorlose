// Lightweight in-process rate limiter (fixed window). NOTE: state lives in this
// server instance only — under serverless each warm instance keeps its own
// window, so this is a best-effort abuse guard, not a strict global quota.
// Swap the Map for Redis/a DB table if global limits are ever required.
import "server-only";

import { RateLimitError } from "@/lib/errors";

const buckets = new Map();

function sweep(now) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Throw RateLimitError when `key` exceeds `limit` hits within `windowMs`.
 * @param {string} key stable identifier, e.g. `create:${userId}`
 */
export function enforceRateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  if (buckets.size > 5000) sweep(now);

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    throw new RateLimitError(`Too many requests. Try again in ${retryAfter}s.`);
  }
}
