// Statistics. Financial + challenge counts are the source of truth in PostgreSQL.
// Visitor/online metrics come from PostHog and are wired in Phase 6.
import { CURRENCY } from "@/lib/constants";
import { query, queryOne } from "@/lib/db";
import { formatCurrency } from "@/lib/formatters";
import { toNumber } from "@/lib/mappers";
import { getVisitorStats } from "@/lib/posthog-insights";
import { boostVisitorStats } from "@/lib/visitor-boost";

export async function getLiveStats() {
  const row = await queryOne(`
    SELECT
      (SELECT count(*)::int FROM "challenge" WHERE "deletedAt" IS NULL AND status NOT IN ('DRAFT','PAYMENT_PENDING')) AS "totalChallenges",
      (SELECT count(*)::int FROM "challenge" WHERE status = 'ACTIVE' AND "deletedAt" IS NULL) AS "activeChallenges",
      (SELECT count(*)::int FROM "challenge" WHERE status = 'WON' AND "deletedAt" IS NULL) AS "challengesWon",
      (SELECT count(*)::int FROM "challenge" WHERE status IN ('WON','LOST','SETTLED') AND "deletedAt" IS NULL) AS "challengesCompleted",
      (SELECT COALESCE(SUM(amount), 0) FROM "transaction" WHERE type = 'COMMITMENT' AND status = 'SUCCEEDED') AS "totalCommitted",
      (SELECT COALESCE(SUM(amount), 0) FROM "transaction" WHERE type = 'REWARD') AS "totalReturned"
  `);

  const totalCommitted = toNumber(row?.totalCommitted);
  const totalReturned = toNumber(row?.totalReturned);

  // Visitor metrics from PostHog (null when unconfigured/unavailable → UI shows "—").
  // TEMPORARY: display-only inflation that auto-expires (lib/visitor-boost.js).
  const visitors = boostVisitorStats(await getVisitorStats());

  return {
    totalChallenges: row?.totalChallenges ?? 0,
    activeChallenges: row?.activeChallenges ?? 0,
    challengesWon: row?.challengesWon ?? 0,
    challengesCompleted: row?.challengesCompleted ?? 0,
    totalCommitted,
    totalReturned,
    totalLost: Math.max(0, totalCommitted - totalReturned),
    currency: CURRENCY.INR,
    // Visitor metrics — populated by PostHog (null = not yet available).
    online: visitors?.online ?? null,
    visitorsSinceLaunch: visitors?.visitorsSinceLaunch ?? null,
    uniqueVisitorsSinceLaunch: visitors?.uniqueVisitorsSinceLaunch ?? null,
    visitorsThisMonth: visitors?.visitorsThisMonth ?? null,
    uniqueVisitorsThisMonth: visitors?.uniqueVisitorsThisMonth ?? null,
    visitorsToday: visitors?.visitorsToday ?? null,
    uniqueVisitorsToday: visitors?.uniqueVisitorsToday ?? null,
  };
}

function timeAgo(input) {
  const then = new Date(input).getTime();
  if (!Number.isFinite(then)) return "";
  const min = Math.floor(Math.max(0, Date.now() - then) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

// Recent public/anonymous challenge activity for the landing ticker. Identity is
// never revealed ("Someone") so anonymous challenges stay anonymous.
export async function getRecentActivity({ limit = 12 } = {}) {
  const rows = await query(
    `SELECT c.id, c.status, c.amount, c.currency, c."createdAt", c."settledAt",
            cat.label AS "categoryLabel"
       FROM "challenge" c
       JOIN "challengeCategory" cat ON cat.id = c."categoryId"
      WHERE c."deletedAt" IS NULL
        AND c.visibility IN ('PUBLIC','ANONYMOUS')
        AND c.status NOT IN ('DRAFT','PAYMENT_PENDING')
      ORDER BY GREATEST(c."createdAt", COALESCE(c."settledAt", c."createdAt")) DESC
      LIMIT $1`,
    [Math.max(1, Math.min(30, Math.floor(Number(limit) || 12)))]
  );
  return rows.map((row) => {
    const money = formatCurrency(Number(row.amount), row.currency);
    const category = String(row.categoryLabel || "fitness").toLowerCase();
    const won = row.status === "WON" || row.status === "SETTLED";
    return {
      id: row.id,
      type: won ? "won" : "created",
      text: won
        ? `Someone won a ${money} ${category} challenge`
        : `Someone committed ${money} to a ${category} challenge`,
      agoLabel: timeAgo(won ? (row.settledAt ?? row.createdAt) : row.createdAt),
    };
  });
}

// Per-user profile stats. Source of truth = PostgreSQL.
export async function getUserProfileStats(userId) {
  const row = await queryOne(
    `SELECT
       (SELECT count(*)::int FROM "challenge"
         WHERE "ownerId" = $1 AND "deletedAt" IS NULL
           AND status NOT IN ('DRAFT','PAYMENT_PENDING')) AS "totalChallenges",
       (SELECT count(*)::int FROM "challenge"
         WHERE "ownerId" = $1 AND "deletedAt" IS NULL
           AND status IN ('WON','SETTLED')) AS "won",
       (SELECT count(*)::int FROM "challenge"
         WHERE "ownerId" = $1 AND "deletedAt" IS NULL AND status = 'LOST') AS "lost",
       (SELECT COALESCE(SUM(amount),0) FROM "transaction"
         WHERE "userId" = $1 AND type = 'COMMITMENT' AND status = 'SUCCEEDED') AS "totalCommitted",
       (SELECT COALESCE(SUM(amount),0) FROM "transaction"
         WHERE "userId" = $1 AND type = 'REWARD') AS "totalReturned"`,
    [userId]
  );
  const won = row?.won ?? 0;
  const lost = row?.lost ?? 0;
  const decided = won + lost;
  return {
    totalChallenges: row?.totalChallenges ?? 0,
    won,
    lost,
    winRate: decided > 0 ? Math.round((won / decided) * 100) : 0,
    totalCommitted: toNumber(row?.totalCommitted),
    totalReturned: toNumber(row?.totalReturned),
  };
}

export async function getAdminStats() {
  const row = await queryOne(`
    SELECT
      (SELECT count(*)::int FROM "user" WHERE "deletedAt" IS NULL) AS "usersTotal",
      (SELECT count(*)::int FROM "challenge" WHERE "deletedAt" IS NULL AND status NOT IN ('DRAFT','PAYMENT_PENDING')) AS "challengesTotal",
      (SELECT count(*)::int FROM "challenge" WHERE status = 'ACTIVE' AND "deletedAt" IS NULL) AS "activeChallenges",
      (SELECT count(*)::int FROM "submission" WHERE status = 'PENDING') AS "pendingReviews",
      (SELECT count(*)::int FROM "dispute" WHERE status IN ('OPEN','UNDER_REVIEW')) AS "openDisputes",
      (SELECT count(*)::int FROM "settlement" WHERE status IN ('PENDING','PROCESSING')) AS "settlementQueue",
      (SELECT COALESCE(SUM(amount), 0) FROM "transaction" WHERE type = 'COMMITMENT' AND status = 'SUCCEEDED') AS "moneyCommitted",
      (SELECT COALESCE(SUM(amount), 0) FROM "transaction" WHERE type = 'REWARD') AS "moneyReturned"
  `);

  const moneyCommitted = toNumber(row?.moneyCommitted);
  const moneyReturned = toNumber(row?.moneyReturned);

  return {
    usersTotal: row?.usersTotal ?? 0,
    challengesTotal: row?.challengesTotal ?? 0,
    activeChallenges: row?.activeChallenges ?? 0,
    pendingReviews: row?.pendingReviews ?? 0,
    openDisputes: row?.openDisputes ?? 0,
    settlementQueue: row?.settlementQueue ?? 0,
    moneyCommitted,
    moneyReturned,
    moneyHeld: Math.max(0, moneyCommitted - moneyReturned),
    currency: CURRENCY.INR,
  };
}
