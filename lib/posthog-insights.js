// Server-only. Reads aggregate visitor metrics from PostHog via the Query API
// (HogQL). Every failure path returns null so the public stats page degrades
// gracefully to "—" instead of ever breaking the request.
import "server-only";

import { logger } from "@/lib/logger";

const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
// The Query API lives on the app host (us/eu.posthog.com), not the ingestion host.
const API_HOST = (
  process.env.POSTHOG_API_HOST || "https://us.posthog.com"
).replace(/\/+$/, "");

// Pageview counts + unique persons across a few windows, plus a 5-minute
// "online now" gauge — all in a single round-trip.
const VISITOR_QUERY = `
  SELECT
    uniqIf(person_id, timestamp > now() - toIntervalMinute(5)) AS online,
    count() AS visitorsSinceLaunch,
    uniq(person_id) AS uniqueVisitorsSinceLaunch,
    countIf(timestamp >= toStartOfMonth(now())) AS visitorsThisMonth,
    uniqIf(person_id, timestamp >= toStartOfMonth(now())) AS uniqueVisitorsThisMonth,
    countIf(timestamp >= toStartOfDay(now())) AS visitorsToday,
    uniqIf(person_id, timestamp >= toStartOfDay(now())) AS uniqueVisitorsToday
  FROM events
  WHERE event = '$pageview'
`;

const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 4000;
let cache = { at: 0, value: null };

function isConfigured() {
  return Boolean(PROJECT_ID && PERSONAL_API_KEY);
}

/**
 * Aggregate visitor metrics from PostHog, or null when unconfigured/unavailable.
 * Results are cached in-process for 60s to avoid hitting the Query API on every
 * page render.
 * @returns {Promise<null | {
 *   online: number, visitorsSinceLaunch: number, uniqueVisitorsSinceLaunch: number,
 *   visitorsThisMonth: number, uniqueVisitorsThisMonth: number,
 *   visitorsToday: number, uniqueVisitorsToday: number
 * }>}
 */
export async function getVisitorStats() {
  if (!isConfigured()) return null;

  const now = Date.now();
  if (cache.value && now - cache.at < CACHE_TTL_MS) return cache.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_HOST}/api/projects/${PROJECT_ID}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERSONAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query: VISITOR_QUERY },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      logger.warn("PostHog query failed", { status: res.status });
      return null;
    }

    const json = await res.json();
    const row = json?.results?.[0];
    if (!Array.isArray(row)) return null;

    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const value = {
      online: num(row[0]),
      visitorsSinceLaunch: num(row[1]),
      uniqueVisitorsSinceLaunch: num(row[2]),
      visitorsThisMonth: num(row[3]),
      uniqueVisitorsThisMonth: num(row[4]),
      visitorsToday: num(row[5]),
      uniqueVisitorsToday: num(row[6]),
    };
    cache = { at: now, value };
    return value;
  } catch (error) {
    // Timeouts, network errors, malformed JSON — never surface to the caller.
    logger.warn("PostHog query error", { error: error?.message });
    return null;
  } finally {
    clearTimeout(timer);
  }
}
