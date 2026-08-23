// Server-side input validation. Never rely on the client — every important
// value is validated here before it reaches the database. Returns a predictable
// { success, data, fieldErrors } shape.
import { CHALLENGE_CATEGORIES } from "@/data/challenge-categories";

import {
  CURRENCY,
  DB_PROVIDER_BY_SLUG,
  getMinCommitment,
  MAX_CHALLENGE_DAYS,
  MIN_CHALLENGE_DAYS,
  PROOF_TYPE,
  PROVIDER_CONNECT,
  PROVIDER_META,
  REQUIREMENT_TYPE,
  VERIFICATION_TYPE,
  VISIBILITY,
} from "@/lib/constants";

const CATEGORY_SLUGS = new Set(
  CHALLENGE_CATEGORIES.map((category) => category.slug)
);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

function fail(fieldErrors) {
  return { success: false, data: null, fieldErrors };
}
function pass(data) {
  return { success: true, data, fieldErrors: null };
}
function inEnum(enumObject, value) {
  return Object.values(enumObject).includes(value);
}

const MAX_AMOUNT = 10_000_000;

export function validateCreateChallenge(input) {
  const errors = {};

  const title = String(input?.title ?? "").trim();
  if (title.length < 3) errors.title = "Give your challenge a clear title.";
  else if (title.length > 120)
    errors.title = "Title must be under 120 characters.";

  const categorySlug = String(input?.categorySlug ?? "");
  if (!CATEGORY_SLUGS.has(categorySlug))
    errors.categorySlug = "Choose a valid category.";

  const currency =
    input?.currency === CURRENCY.USD ? CURRENCY.USD : CURRENCY.INR;
  const minAmount = getMinCommitment(currency);
  const amount = Number(input?.amount);
  if (!Number.isFinite(amount) || amount < minAmount) {
    errors.amount = `Minimum commitment is ${minAmount} ${currency}.`;
  } else if (amount > MAX_AMOUNT) {
    errors.amount = "That amount is too large.";
  }

  const durationDays = Number(input?.durationDays);
  if (
    !Number.isInteger(durationDays) ||
    durationDays < MIN_CHALLENGE_DAYS ||
    durationDays > MAX_CHALLENGE_DAYS
  ) {
    errors.durationDays = `Duration must be between ${MIN_CHALLENGE_DAYS} and ${MAX_CHALLENGE_DAYS} days.`;
  }

  const visibility = inEnum(VISIBILITY, input?.visibility)
    ? input.visibility
    : VISIBILITY.PUBLIC;
  const verificationType = inEnum(VERIFICATION_TYPE, input?.verificationType)
    ? input.verificationType
    : VERIFICATION_TYPE.MANUAL;
  // Normalize the chosen provider slug to its DB enum key (null for manual).
  const providerSlug = String(input?.verificationProvider ?? "").toLowerCase();
  const verificationProvider =
    verificationType === VERIFICATION_TYPE.MANUAL
      ? null
      : (DB_PROVIDER_BY_SLUG[providerSlug] ?? null);
  // Automatic verification requires a provider the user can actually connect
  // from the web — otherwise the challenge could never be activated or verified.
  if (verificationType === VERIFICATION_TYPE.AUTOMATIC) {
    const meta = PROVIDER_META[providerSlug];
    if (!verificationProvider) {
      errors.verificationProvider =
        "Choose a fitness provider for automatic verification.";
    } else if (
      !meta?.enabled ||
      meta.connectVia !== PROVIDER_CONNECT.WEB_OAUTH
    ) {
      errors.verificationProvider =
        "That provider isn't available for automatic verification yet — pick a connectable one, or use Hybrid/Manual.";
    }
  }
  const requirementType = inEnum(REQUIREMENT_TYPE, input?.requirementType)
    ? input.requirementType
    : REQUIREMENT_TYPE.TOTAL;

  const targetValue = numberOrNull(input?.targetValue);
  if (
    targetValue !== null &&
    (!Number.isFinite(targetValue) || targetValue <= 0)
  ) {
    errors.targetValue = "Target must be a positive number.";
  }
  const startingValue = numberOrNull(input?.startingValue);

  let startDate = null;
  if (input?.startDate) {
    startDate = new Date(input.startDate);
    if (Number.isNaN(startDate.getTime()))
      errors.startDate = "Enter a valid start date.";
  }

  const description = input?.description
    ? String(input.description).slice(0, 2000)
    : null;
  const unit = input?.unit ? String(input.unit).slice(0, 24) : null;
  const coverImageUrl =
    input?.coverImageUrl && /^https?:\/\//i.test(String(input.coverImageUrl))
      ? String(input.coverImageUrl).slice(0, 1000)
      : null;

  if (Object.keys(errors).length > 0) return fail(errors);

  return pass({
    title,
    categorySlug,
    currency,
    amount: Math.round(amount),
    durationDays,
    visibility,
    verificationType,
    verificationProvider,
    requirementType,
    targetValue,
    startingValue,
    startDate,
    description,
    unit,
    coverImageUrl,
  });
}

export function validateSubmission(input) {
  const errors = {};

  const challengeId = String(input?.challengeId ?? "");
  if (!isUuid(challengeId)) errors.challengeId = "Invalid challenge.";

  const type = inEnum(PROOF_TYPE, input?.type) ? input.type : PROOF_TYPE.PHOTO;
  const label = input?.label ? String(input.label).slice(0, 120) : null;
  const note = input?.note ? String(input.note).slice(0, 1000) : null;
  const fileUrl = input?.fileUrl ? String(input.fileUrl).slice(0, 1000) : null;

  if (Object.keys(errors).length > 0) return fail(errors);
  return pass({ challengeId, type, label, note, fileUrl });
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  return Number(value);
}
