// Challenge read queries for server components. Visibility rules are enforced
// here: private challenges are hidden from non-owners, anonymous identities are
// stripped by the mappers.
import {
  CHALLENGE_STATUS,
  LEADERBOARD_PAGE_SIZE,
  VISIBILITY,
} from "@/lib/constants";
import { query, queryOne } from "@/lib/db";
import {
  CHALLENGE_FROM,
  CHALLENGE_SELECT,
  mapChallengeCard,
  mapChallengeDetail,
} from "@/lib/mappers";
import { canViewChallenge, isAdmin, isOwner } from "@/lib/permissions";
import { isUuid } from "@/lib/validations";

// USD normalized to INR so a single leaderboard ranks mixed currencies sensibly.
const RANK_ORDER = `(CASE WHEN c.currency = 'USD' THEN c.amount * 83 ELSE c.amount END) DESC, c."createdAt" ASC`;
const PUBLIC_VISIBILITY = `c.visibility IN ('${VISIBILITY.PUBLIC}', '${VISIBILITY.ANONYMOUS}')`;

async function paginatedChallenges({
  where,
  params = [],
  page = 1,
  pageSize = LEADERBOARD_PAGE_SIZE,
  viewer = null,
}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeSize = Math.max(
    1,
    Math.floor(Number(pageSize) || LEADERBOARD_PAGE_SIZE)
  );
  const offset = (safePage - 1) * safeSize;

  const totalRow = await queryOne(
    `SELECT count(*)::int AS total FROM "challenge" c WHERE ${where}`,
    params
  );
  const total = totalRow?.total ?? 0;

  const rows = await query(
    `SELECT ${CHALLENGE_SELECT} ${CHALLENGE_FROM} WHERE ${where} ORDER BY ${RANK_ORDER} LIMIT ${safeSize} OFFSET ${offset}`,
    params
  );

  const items = rows.map((row, index) =>
    mapChallengeCard({ ...row, rank: offset + index + 1 }, viewer)
  );
  return {
    items,
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

/** Active public/anonymous challenges, ranked by commitment. */
export function getLeaderboard({ page, pageSize, viewer } = {}) {
  const where = `c.status = '${CHALLENGE_STATUS.ACTIVE}' AND ${PUBLIC_VISIBILITY} AND c."deletedAt" IS NULL`;
  return paginatedChallenges({ where, page, pageSize, viewer });
}

/** Won public/anonymous challenges, ranked by commitment. */
export function getWonLeaderboard({ page, pageSize, viewer } = {}) {
  const where = `c.status = '${CHALLENGE_STATUS.WON}' AND ${PUBLIC_VISIBILITY} AND c."deletedAt" IS NULL`;
  return paginatedChallenges({ where, page, pageSize, viewer });
}

/** Active challenges in a category (for SEO category pages). */
export async function getActiveChallengesByCategory(
  categorySlug,
  { limit = 6, viewer = null } = {}
) {
  const rows = await query(
    `SELECT ${CHALLENGE_SELECT} ${CHALLENGE_FROM}
     WHERE c.status = '${CHALLENGE_STATUS.ACTIVE}' AND ${PUBLIC_VISIBILITY} AND c."deletedAt" IS NULL AND cat.slug = $1
     ORDER BY ${RANK_ORDER} LIMIT $2`,
    [categorySlug, Math.max(1, Math.floor(limit))]
  );
  return rows.map((row, index) =>
    mapChallengeCard({ ...row, rank: index + 1 }, viewer)
  );
}

/** Every challenge owned by a user (dashboard/profile). Viewer is the owner. */
export async function getUserChallenges(userId, viewer = null) {
  if (!isUuid(userId)) return [];
  const rows = await query(
    `SELECT ${CHALLENGE_SELECT} ${CHALLENGE_FROM} WHERE c."ownerId" = $1 AND c."deletedAt" IS NULL ORDER BY c."createdAt" DESC`,
    [userId]
  );
  return rows.map((row) => mapChallengeCard(row, viewer ?? { id: userId }));
}

/** Raw challenge row (for actions/ownership checks). No mapping, no visibility. */
export function getChallengeRow(id) {
  if (!isUuid(id)) return null;
  return queryOne(
    `SELECT ${CHALLENGE_SELECT} ${CHALLENGE_FROM} WHERE c.id = $1 AND c."deletedAt" IS NULL`,
    [id]
  );
}

/** Full challenge detail, enforcing visibility. Returns null if not viewable. */
export async function getChallengeById(id, viewer = null) {
  const row = await getChallengeRow(id);
  if (!row) return null;
  if (!canViewChallenge(viewer, row)) return null;

  const privileged = isOwner(viewer, row) || isAdmin(viewer);
  let proofs = [];
  if (privileged) {
    proofs = await query(
      `SELECT id, type, status, label, note, "fileUrl", "createdAt"
       FROM "submission" WHERE "challengeId" = $1 ORDER BY "createdAt" DESC`,
      [id]
    );
  }

  // Reward transaction reference is private financial data — owner/admin only.
  let refundTxnId = null;
  if (
    privileged &&
    (row.status === CHALLENGE_STATUS.WON ||
      row.status === CHALLENGE_STATUS.SETTLED)
  ) {
    const txn = await queryOne(
      `SELECT id, reference FROM "transaction" WHERE "challengeId" = $1 AND type = 'REWARD' ORDER BY "createdAt" DESC LIMIT 1`,
      [id]
    );
    refundTxnId = txn?.reference ?? txn?.id ?? null;
  }

  if (
    (row.status === CHALLENGE_STATUS.ACTIVE ||
      row.status === CHALLENGE_STATUS.WON) &&
    row.visibility !== VISIBILITY.PRIVATE
  ) {
    const normalized =
      row.currency === "USD" ? Number(row.amount) * 83 : Number(row.amount);
    const rankRow = await queryOne(
      `SELECT count(*) + 1 AS rank FROM "challenge" c
       WHERE c.status = $1 AND ${PUBLIC_VISIBILITY} AND c."deletedAt" IS NULL
         AND (CASE WHEN c.currency = 'USD' THEN c.amount * 83 ELSE c.amount END) > $2`,
      [row.status, normalized]
    );
    row.rank = Number(rankRow?.rank ?? 0) || null;
  }

  return mapChallengeDetail(row, viewer, { proofs, refundTxnId });
}
