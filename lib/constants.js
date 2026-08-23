/**
 * Centralized application constants, enums and business rules.
 * Single source of truth — never scatter these magic strings/numbers across the app.
 */

// ---------------------------------------------------------------------------
// Challenge lifecycle status (internal / full model)
// ---------------------------------------------------------------------------
export const CHALLENGE_STATUS = {
  DRAFT: "DRAFT",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  SCHEDULED: "SCHEDULED",
  ACTIVE: "ACTIVE",
  AWAITING_VERIFICATION: "AWAITING_VERIFICATION",
  VERIFIED: "VERIFIED",
  UNDER_REVIEW: "UNDER_REVIEW",
  AWAITING_REVIEW: "AWAITING_REVIEW",
  WON: "WON",
  LOST: "LOST",
  DISPUTED: "DISPUTED",
  SETTLED: "SETTLED",
};

// Status metadata: display label + semantic tone (tone → colors handled in UI).
export const STATUS_META = {
  [CHALLENGE_STATUS.DRAFT]: { label: "Draft", tone: "muted" },
  [CHALLENGE_STATUS.PAYMENT_PENDING]: {
    label: "Payment Pending",
    tone: "warning",
  },
  [CHALLENGE_STATUS.SCHEDULED]: { label: "Upcoming", tone: "scheduled" },
  [CHALLENGE_STATUS.ACTIVE]: { label: "Active", tone: "active" },
  [CHALLENGE_STATUS.AWAITING_VERIFICATION]: {
    label: "Awaiting Verification",
    tone: "warning",
  },
  [CHALLENGE_STATUS.VERIFIED]: { label: "Verified", tone: "info" },
  [CHALLENGE_STATUS.UNDER_REVIEW]: { label: "Under Review", tone: "warning" },
  [CHALLENGE_STATUS.AWAITING_REVIEW]: {
    label: "Awaiting Review",
    tone: "warning",
  },
  [CHALLENGE_STATUS.WON]: { label: "Won", tone: "success" },
  [CHALLENGE_STATUS.LOST]: { label: "Lost", tone: "danger" },
  [CHALLENGE_STATUS.DISPUTED]: { label: "Disputed", tone: "danger" },
  [CHALLENGE_STATUS.SETTLED]: { label: "Settled", tone: "success" },
};

export function getStatusMeta(status) {
  return STATUS_META[status] ?? { label: status ?? "Unknown", tone: "muted" };
}

// ---------------------------------------------------------------------------
// Challenge visibility
// ---------------------------------------------------------------------------
export const VISIBILITY = {
  PUBLIC: "PUBLIC",
  ANONYMOUS: "ANONYMOUS",
  PRIVATE: "PRIVATE",
};

export const VISIBILITY_META = {
  [VISIBILITY.PUBLIC]: {
    label: "Public",
    description: "Your name is shown publicly.",
    icon: "Globe",
  },
  [VISIBILITY.ANONYMOUS]: {
    label: "Anonymous",
    description: "Appears on the leaderboard without your identity.",
    icon: "VenetianMask",
  },
  [VISIBILITY.PRIVATE]: {
    label: "Private",
    description: "Only you and admins can see this challenge.",
    icon: "Lock",
  },
};

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------
export const VERIFICATION_TYPE = {
  AUTOMATIC: "AUTOMATIC",
  MANUAL: "MANUAL",
  HYBRID: "HYBRID",
};

export const VERIFICATION_TYPE_META = {
  [VERIFICATION_TYPE.AUTOMATIC]: {
    label: "Automatic",
    description: "Verified using a connected fitness account.",
    icon: "Watch",
  },
  [VERIFICATION_TYPE.MANUAL]: {
    label: "Manual",
    description: "You submit proof for admin review.",
    icon: "Upload",
  },
  [VERIFICATION_TYPE.HYBRID]: {
    label: "Hybrid",
    description: "Fitness data plus manual review.",
    icon: "GitMerge",
  },
};

// ---------------------------------------------------------------------------
// Normalized fitness activity types
// ---------------------------------------------------------------------------
export const ACTIVITY_TYPE = {
  RUN: "RUN",
  WALK: "WALK",
  CYCLE: "CYCLE",
  SWIM: "SWIM",
  WORKOUT: "WORKOUT",
  STRENGTH: "STRENGTH",
  OTHER: "OTHER",
};

// ---------------------------------------------------------------------------
// Payment / transactions
// ---------------------------------------------------------------------------
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  REWARDED: "REWARDED",
};

export const PAYMENT_STATUS_META = {
  [PAYMENT_STATUS.PENDING]: { label: "Pending", tone: "warning" },
  [PAYMENT_STATUS.PROCESSING]: { label: "Processing", tone: "warning" },
  [PAYMENT_STATUS.SUCCEEDED]: { label: "Succeeded", tone: "success" },
  [PAYMENT_STATUS.FAILED]: { label: "Failed", tone: "danger" },
  [PAYMENT_STATUS.CANCELLED]: { label: "Cancelled", tone: "muted" },
  [PAYMENT_STATUS.REFUNDED]: { label: "Refunded", tone: "info" },
  [PAYMENT_STATUS.REWARDED]: { label: "Rewarded", tone: "success" },
};

export const TRANSACTION_TYPE = {
  COMMITMENT: "COMMITMENT",
  REWARD: "REWARD",
  REFUND: "REFUND",
};

// ---------------------------------------------------------------------------
// Proof / submission types
// ---------------------------------------------------------------------------
export const PROOF_TYPE = {
  PHOTO: "PHOTO",
  VIDEO: "VIDEO",
  SCREENSHOT: "SCREENSHOT",
  DOCUMENT: "DOCUMENT",
  ACTIVITY: "ACTIVITY",
  OTHER: "OTHER",
};

// ---------------------------------------------------------------------------
// Currency & commitment rules
// ---------------------------------------------------------------------------
export const CURRENCY = {
  INR: "INR",
  USD: "USD",
};

export const CURRENCY_SYMBOL = {
  [CURRENCY.INR]: "₹",
  [CURRENCY.USD]: "$",
};

export const MIN_CHALLENGE_DAYS = 30; // 1 month
export const MAX_CHALLENGE_DAYS = 365; // 1 year
export const MIN_COMMITMENT_INR = 100;
export const MIN_COMMITMENT_USD = 10;

export function getMinCommitment(currency) {
  return currency === CURRENCY.USD ? MIN_COMMITMENT_USD : MIN_COMMITMENT_INR;
}

// ---------------------------------------------------------------------------
// Leaderboard / pagination
// ---------------------------------------------------------------------------
export const LEADERBOARD_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Fitness providers (integration architecture is provider-agnostic)
// ---------------------------------------------------------------------------
export const FITNESS_PROVIDER = {
  STRAVA: "strava",
  FITBIT: "fitbit",
  APPLE_HEALTH: "apple_health",
  GOOGLE_HEALTH_CONNECT: "google_health_connect",
  SAMSUNG_HEALTH: "samsung_health",
};

// ---------------------------------------------------------------------------
// Backend enums — mirror the Prisma schema (prisma/contract.prisma) exactly.
// ---------------------------------------------------------------------------
export const USER_ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
};

export const REQUIREMENT_TYPE = {
  DAILY: "DAILY",
  TOTAL: "TOTAL",
  FREQUENCY: "FREQUENCY",
};

export const SUBMISSION_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
};

export const SUBMISSION_STATUS_META = {
  [SUBMISSION_STATUS.PENDING]: { label: "Pending", tone: "warning" },
  [SUBMISSION_STATUS.VERIFIED]: { label: "Verified", tone: "success" },
  [SUBMISSION_STATUS.REJECTED]: { label: "Rejected", tone: "danger" },
};

export const DISPUTE_STATUS = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

export const SETTLEMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SETTLED: "SETTLED",
  FAILED: "FAILED",
};

export const PAYMENT_PROVIDER = {
  DODO: "DODO",
};

export const PAYMENT_PROVIDER_LABEL = {
  [PAYMENT_PROVIDER.DODO]: "Dodo Payments",
};

export const ACTIVITY_SOURCE = {
  DEVICE_RECORDED: "DEVICE_RECORDED",
  MANUALLY_ENTERED: "MANUALLY_ENTERED",
  IMPORTED: "IMPORTED",
};

// DB FitnessProviderType (uppercase) → display label.
export const FITNESS_PROVIDER_LABEL = {
  STRAVA: "Strava",
  FITBIT: "Fitbit",
  APPLE_HEALTH: "Apple Health",
  GOOGLE_HEALTH_CONNECT: "Health Connect",
  SAMSUNG_HEALTH: "Samsung Health",
};

// How a provider connects. Web-OAuth providers can be linked from the browser;
// native ecosystems need a mobile app and must NOT fake a browser connection.
export const PROVIDER_CONNECT = {
  WEB_OAUTH: "web_oauth",
  NATIVE: "native",
};

// Single source of truth bridging the app slug (used in URLs) ↔ the DB
// FitnessProviderType enum (UPPERCASE), plus how/whether each provider connects.
// Only Strava is wired today; the rest are architecturally ready but disabled.
export const PROVIDER_META = {
  [FITNESS_PROVIDER.STRAVA]: {
    slug: FITNESS_PROVIDER.STRAVA,
    dbKey: "STRAVA",
    label: "Strava",
    connectVia: PROVIDER_CONNECT.WEB_OAUTH,
    enabled: true,
    scopes: "read,activity:read_all",
    icon: "Activity",
    description: "Auto-verify runs, rides, swims and workouts.",
  },
  [FITNESS_PROVIDER.FITBIT]: {
    slug: FITNESS_PROVIDER.FITBIT,
    dbKey: "FITBIT",
    label: "Fitbit",
    connectVia: PROVIDER_CONNECT.WEB_OAUTH,
    enabled: true,
    scopes: "activity",
    icon: "Watch",
    description: "Auto-verify steps, walks, runs and workouts.",
  },
  [FITNESS_PROVIDER.APPLE_HEALTH]: {
    slug: FITNESS_PROVIDER.APPLE_HEALTH,
    dbKey: "APPLE_HEALTH",
    label: "Apple Health",
    connectVia: PROVIDER_CONNECT.NATIVE,
    enabled: false,
    scopes: null,
    icon: "Apple",
    description: "Requires the FitOrLose mobile app.",
  },
  [FITNESS_PROVIDER.GOOGLE_HEALTH_CONNECT]: {
    slug: FITNESS_PROVIDER.GOOGLE_HEALTH_CONNECT,
    dbKey: "GOOGLE_HEALTH_CONNECT",
    label: "Health Connect",
    connectVia: PROVIDER_CONNECT.NATIVE,
    enabled: false,
    scopes: null,
    icon: "HeartPulse",
    description: "Requires the FitOrLose mobile app.",
  },
  [FITNESS_PROVIDER.SAMSUNG_HEALTH]: {
    slug: FITNESS_PROVIDER.SAMSUNG_HEALTH,
    dbKey: "SAMSUNG_HEALTH",
    label: "Samsung Health",
    connectVia: PROVIDER_CONNECT.NATIVE,
    enabled: false,
    scopes: null,
    icon: "Smartphone",
    description: "Requires the FitOrLose mobile app.",
  },
};

export const DB_PROVIDER_BY_SLUG = Object.fromEntries(
  Object.values(PROVIDER_META).map((provider) => [
    provider.slug,
    provider.dbKey,
  ])
);
export const SLUG_BY_DB_PROVIDER = Object.fromEntries(
  Object.values(PROVIDER_META).map((provider) => [
    provider.dbKey,
    provider.slug,
  ])
);
