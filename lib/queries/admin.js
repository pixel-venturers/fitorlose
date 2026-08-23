// Admin read queries. Admins see full identity regardless of challenge visibility.
import {
  LEADERBOARD_PAGE_SIZE,
  PAYMENT_PROVIDER_LABEL,
  USER_ROLE,
} from "@/lib/constants";
import { query, queryOne } from "@/lib/db";
import {
  CHALLENGE_FROM,
  CHALLENGE_SELECT,
  mapChallengeCard,
  toNumber,
} from "@/lib/mappers";

const ADMIN_VIEWER = { role: USER_ROLE.ADMIN, id: "__admin__" };
const iso = (value) => (value ? new Date(value).toISOString() : null);
const providerLabel = (key) => PAYMENT_PROVIDER_LABEL[key] ?? key;

export async function getPendingSubmissions() {
  const rows = await query(
    `SELECT s.id, s.type, s.status, s.flagged, s.note, s."fileUrl", s."createdAt",
            c.id AS "challengeId", c.title AS "challengeTitle", c.status AS "challengeStatus", c."verificationType",
            u.id AS "userId", u.name AS "userName", u.email AS "userEmail"
     FROM "submission" s
     JOIN "challenge" c ON c.id = s."challengeId"
     JOIN "user" u ON u.id = s."userId"
     WHERE s.status = 'PENDING'
     ORDER BY s.flagged DESC, s."createdAt" DESC`
  );
  return rows.map((row) => ({
    id: row.id,
    challenge: {
      id: row.challengeId,
      title: row.challengeTitle,
      status: row.challengeStatus,
    },
    user: { id: row.userId, name: row.userName, email: row.userEmail },
    verificationType: row.verificationType,
    type: row.type,
    status: row.status,
    submittedAt: iso(row.createdAt),
    flagged: row.flagged,
    flagReason: null,
    note: row.note ?? null,
    fileUrl: row.fileUrl ?? null,
    media: row.fileUrl
      ? [{ kind: "image", label: "Proof", url: row.fileUrl }]
      : [],
  }));
}

export async function getSubmissionById(id) {
  const row = await queryOne(
    `SELECT s.id, s.type, s.status, s.flagged, s.note, s."fileUrl", s."createdAt", s.label,
            c.id AS "challengeId", c.title AS "challengeTitle", c."verificationType",
            u.id AS "userId", u.name AS "userName", u.email AS "userEmail"
     FROM "submission" s
     JOIN "challenge" c ON c.id = s."challengeId"
     JOIN "user" u ON u.id = s."userId"
     WHERE s.id = $1`,
    [id]
  );
  if (!row) return null;
  return {
    id: row.id,
    label: row.label ?? "Proof",
    challenge: { id: row.challengeId, title: row.challengeTitle },
    user: { id: row.userId, name: row.userName, email: row.userEmail },
    verificationType: row.verificationType,
    type: row.type,
    status: row.status,
    submittedAt: iso(row.createdAt),
    flagged: row.flagged,
    note: row.note ?? null,
    fileUrl: row.fileUrl ?? null,
  };
}

export async function getAdminChallenges({
  page = 1,
  pageSize = LEADERBOARD_PAGE_SIZE,
} = {}) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeSize = Math.max(
    1,
    Math.floor(Number(pageSize) || LEADERBOARD_PAGE_SIZE)
  );
  const offset = (safePage - 1) * safeSize;
  const where = `c."deletedAt" IS NULL AND c.status <> 'DRAFT'`;

  const totalRow = await queryOne(
    `SELECT count(*)::int AS total FROM "challenge" c WHERE ${where}`
  );
  const total = totalRow?.total ?? 0;
  const rows = await query(
    `SELECT ${CHALLENGE_SELECT} ${CHALLENGE_FROM} WHERE ${where}
     ORDER BY c."createdAt" DESC LIMIT ${safeSize} OFFSET ${offset}`
  );
  return {
    items: rows.map((row) => mapChallengeCard(row, ADMIN_VIEWER)),
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

export async function getAdminUsers() {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u."createdAt", u.role,
            (SELECT count(*)::int FROM "challenge" WHERE "ownerId" = u.id AND "deletedAt" IS NULL) AS challenges,
            (SELECT COALESCE(SUM(amount), 0) FROM "transaction" WHERE "userId" = u.id AND type = 'COMMITMENT' AND status = 'SUCCEEDED') AS committed
     FROM "user" u WHERE u."deletedAt" IS NULL ORDER BY u."createdAt" DESC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "Member",
    email: row.email,
    joinedAt: iso(row.createdAt),
    challenges: row.challenges,
    committed: toNumber(row.committed),
    status: row.role === USER_ROLE.ADMIN ? "admin" : "active",
  }));
}

export async function getTransactions({ limit = 50 } = {}) {
  const rows = await query(
    `SELECT t.id, t.type, t.amount, t.currency, t.status, t."createdAt",
            COALESCE(p.provider, CASE WHEN t.currency = 'USD' THEN 'DODO' ELSE 'PAYU' END) AS provider,
            c.id AS "challengeId", c.title AS "challengeTitle",
            u.id AS "userId", u.name AS "userName", u.email AS "userEmail"
     FROM "transaction" t
     JOIN "challenge" c ON c.id = t."challengeId"
     JOIN "user" u ON u.id = t."userId"
     LEFT JOIN "payment" p ON p.id = t."paymentId"
     ORDER BY t."createdAt" DESC LIMIT $1`,
    [Math.max(1, Math.floor(limit))]
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    user: { id: row.userId, name: row.userName, email: row.userEmail },
    challenge: { id: row.challengeId, title: row.challengeTitle },
    amount: toNumber(row.amount),
    currency: row.currency,
    provider: providerLabel(row.provider),
    status: row.status,
    createdAt: iso(row.createdAt),
  }));
}

export async function getDisputes() {
  const rows = await query(
    `SELECT d.id, d.reason, d.status, d."openedAt",
            c.id AS "challengeId", c.title AS "challengeTitle",
            u.id AS "userId", u.name AS "userName", u.email AS "userEmail"
     FROM "dispute" d
     JOIN "challenge" c ON c.id = d."challengeId"
     JOIN "user" u ON u.id = d."userId"
     ORDER BY d."openedAt" DESC`
  );
  return rows.map((row) => ({
    id: row.id,
    challenge: { id: row.challengeId, title: row.challengeTitle },
    user: { id: row.userId, name: row.userName, email: row.userEmail },
    reason: row.reason,
    reasonSource: "system",
    status: row.status,
    openedAt: iso(row.openedAt),
  }));
}

export async function getSettlementQueue() {
  const rows = await query(
    `SELECT s.id, s.amount, s.currency, s.result, s.status, s."verifiedAt",
            (CASE WHEN s.currency = 'USD' THEN 'DODO' ELSE 'PAYU' END) AS provider,
            c.id AS "challengeId", c.title AS "challengeTitle", c."verificationType",
            u.id AS "userId", u.name AS "userName", u.email AS "userEmail"
     FROM "settlement" s
     JOIN "challenge" c ON c.id = s."challengeId"
     JOIN "user" u ON u.id = s."userId"
     WHERE s.status IN ('PENDING','PROCESSING')
     ORDER BY s."verifiedAt" ASC NULLS LAST`
  );
  return rows.map((row) => ({
    id: row.id,
    challenge: { id: row.challengeId, title: row.challengeTitle },
    user: { id: row.userId, name: row.userName, email: row.userEmail },
    amount: toNumber(row.amount),
    currency: row.currency,
    provider: providerLabel(row.provider),
    result: row.result,
    verificationType: row.verificationType,
    verifiedAt: iso(row.verifiedAt),
  }));
}
