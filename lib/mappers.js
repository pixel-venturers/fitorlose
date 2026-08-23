// DB row -> UI shape mappers. Keep the UI's expected shapes stable so pages and
// components don't change when data moves from dummy to database.
import { getCategory } from "@/data/challenge-categories";

import {
  CHALLENGE_STATUS,
  FITNESS_PROVIDER_LABEL,
  VERIFICATION_TYPE,
  VISIBILITY,
} from "@/lib/constants";
import { isAdmin, isOwner } from "@/lib/permissions";

const AVATAR_GRADIENTS = [
  "from-sky-500 to-indigo-600",
  "from-blue-500 to-violet-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-blue-700",
  "from-violet-500 to-indigo-700",
  "from-blue-400 to-cyan-600",
];

const DAY = 86_400_000;

// Reusable SQL fragments so every challenge query returns the same columns.
export const CHALLENGE_SELECT = `
  c.id, c.slug, c.title, c.description, c."ownerId", c.visibility, c."verificationType",
  c."verificationProvider", c."requirementType", c."startingValue", c."targetValue", c.unit,
  c."frequencyPerWeek", c.status, c.amount, c.currency, c."startDate", c."endDate",
  c."durationDays", c."coverImageUrl", c."coverGradient", c."progressPercent", c."progressValue",
  c."settledAt", c."createdAt",
  cat.slug AS "categorySlug", cat.label AS "categoryLabel",
  u.name AS "ownerName", u.email AS "ownerEmail"
`;

export const CHALLENGE_FROM = `
  FROM "challenge" c
  JOIN "challengeCategory" cat ON cat.id = c."categoryId"
  JOIN "user" u ON u.id = c."ownerId"
`;

export function toNumber(value) {
  return value === null || value === undefined ? 0 : Number(value);
}

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

function initialsFrom(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function gradientForId(id) {
  let hash = 0;
  const text = String(id ?? "");
  for (let i = 0; i < text.length; i += 1)
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function verificationSource(row) {
  if (row.verificationProvider)
    return (
      FITNESS_PROVIDER_LABEL[row.verificationProvider] ??
      row.verificationProvider
    );
  return row.verificationType === VERIFICATION_TYPE.MANUAL
    ? "Manual"
    : "Automatic";
}

/**
 * Map a joined challenge row to the card/leaderboard shape.
 * Applies visibility: anonymous challenges hide identity unless the viewer is
 * the owner or an admin.
 */
export function mapChallengeCard(row, viewer = null) {
  const category = getCategory(row.categorySlug);
  const reveal =
    row.visibility !== VISIBILITY.ANONYMOUS ||
    isOwner(viewer, row) ||
    isAdmin(viewer);

  const amount = toNumber(row.amount);
  const goalTarget = row.targetValue != null ? toNumber(row.targetValue) : null;
  const goalAchieved =
    row.progressValue != null ? toNumber(row.progressValue) : null;
  const goalUnit = row.unit || category?.unit || "";
  const progressPercent =
    row.progressPercent != null
      ? Number(row.progressPercent)
      : goalTarget
        ? Math.round((toNumber(goalAchieved) / goalTarget) * 100)
        : 0;

  const now = Date.now();
  const endMs = row.endDate ? new Date(row.endDate).getTime() : null;
  const startMs = row.startDate ? new Date(row.startDate).getTime() : null;
  const daysLeft =
    endMs != null ? Math.max(0, Math.ceil((endMs - now) / DAY)) : null;
  const daysElapsed =
    startMs != null
      ? Math.min(
          row.durationDays ?? Infinity,
          Math.max(0, Math.floor((now - startMs) / DAY))
        )
      : null;

  const upcoming = row.status === CHALLENGE_STATUS.SCHEDULED;
  const startsInDays =
    upcoming && startMs != null && startMs > now
      ? Math.max(1, Math.ceil((startMs - now) / DAY))
      : null;

  return {
    id: row.id,
    uuid: row.id,
    slug: row.slug,
    rank: row.rank != null ? Number(row.rank) : null,
    title: row.title,
    description: row.description ?? null,
    categorySlug: row.categorySlug,
    categoryLabel: row.categoryLabel,
    amount,
    currency: row.currency,
    visibility: row.visibility,
    status: row.status,
    upcoming,
    startsInDays,
    verificationType: row.verificationType,
    verificationSource: verificationSource(row),
    durationDays: row.durationDays,
    daysElapsed,
    daysLeft,
    goalTarget,
    goalAchieved,
    goalUnit,
    progressPercent,
    progressLabel:
      goalTarget != null
        ? `${goalAchieved ?? 0} / ${goalTarget} ${goalUnit}`.trim()
        : `${progressPercent}%`,
    gradient: category?.gradient,
    coverImage: row.coverImageUrl || category?.coverImage || null,
    userId: row.ownerId,
    isOwn: isOwner(viewer, row),
    userName: reveal ? (row.ownerName ?? "Member") : "Anonymous",
    userEmail: reveal ? (row.ownerEmail ?? null) : null,
    displayName: reveal ? (row.ownerName ?? "Member") : "Anonymous",
    ownerInitials: reveal ? initialsFrom(row.ownerName) : "",
    avatarGradient: gradientForId(row.ownerId),
    avatarUrl: null,
    startDate: iso(row.startDate),
    endDate: iso(row.endDate),
    completedAt: iso(row.settledAt ?? row.endDate),
    result:
      row.status === CHALLENGE_STATUS.WON ||
      row.status === CHALLENGE_STATUS.LOST
        ? row.status
        : null,
  };
}

/** Detail view: card shape plus proofs and any reward transaction reference. */
export function mapChallengeDetail(
  row,
  viewer = null,
  { proofs = [], refundTxnId = null } = {}
) {
  return {
    ...mapChallengeCard(row, viewer),
    proofs: proofs.map(mapProof),
    refundTxnId,
  };
}

export function mapProof(row) {
  return {
    id: row.id,
    type: row.type,
    label: row.label ?? "Proof",
    note: row.note ?? null,
    fileUrl: row.fileUrl ?? null,
    status: row.status,
    submittedAt: iso(row.createdAt),
  };
}

export function mapPublicUser(row, { reveal = true } = {}) {
  return {
    id: row.id,
    name: reveal ? (row.name ?? "Member") : "Anonymous",
    email: reveal ? (row.email ?? null) : null,
    imageUrl: null,
    initials: reveal ? initialsFrom(row.name) : "",
    avatarGradient: gradientForId(row.id),
  };
}

export { gradientForId, initialsFrom };
