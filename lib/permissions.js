// Authorization rules — a single source of truth for who can do/see what.
// Business rules live here, never only in the UI.
import { CHALLENGE_STATUS, VISIBILITY } from "@/lib/constants";

export function isAdmin(user) {
  return user?.role === "ADMIN";
}

export function isOwner(user, challenge) {
  return Boolean(user) && Boolean(challenge) && challenge.ownerId === user.id;
}

/** Anyone can view public/anonymous challenges; private ones only owner/admin. */
export function canViewChallenge(user, challenge) {
  if (!challenge) return false;
  if (challenge.visibility !== VISIBILITY.PRIVATE) return true;
  return isOwner(user, challenge) || isAdmin(user);
}

/** Whether the viewer may see the owner's real identity on this challenge. */
export function canSeeIdentity(user, challenge) {
  if (!challenge) return false;
  if (challenge.visibility !== VISIBILITY.ANONYMOUS) return true;
  return isOwner(user, challenge) || isAdmin(user);
}

export function canManageChallenge(user, challenge) {
  return isOwner(user, challenge) || isAdmin(user);
}

/** Critical/financial fields can only change before a challenge is active. */
export function canEditChallenge(user, challenge) {
  if (!isOwner(user, challenge)) return false;
  return [CHALLENGE_STATUS.DRAFT, CHALLENGE_STATUS.PAYMENT_PENDING].includes(
    challenge.status
  );
}

export function canDeleteChallenge(user, challenge) {
  if (isAdmin(user)) return true;
  if (!isOwner(user, challenge)) return false;
  return [CHALLENGE_STATUS.DRAFT, CHALLENGE_STATUS.PAYMENT_PENDING].includes(
    challenge.status
  );
}

export function canSubmitProof(user, challenge) {
  if (!isOwner(user, challenge)) return false;
  return [
    CHALLENGE_STATUS.ACTIVE,
    CHALLENGE_STATUS.AWAITING_VERIFICATION,
    CHALLENGE_STATUS.UNDER_REVIEW,
  ].includes(challenge.status);
}
