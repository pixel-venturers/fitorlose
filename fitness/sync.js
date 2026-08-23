// Reusable fitness-sync core (server-only, NOT a Server Action file) so both the
// SyncFitnessActivities action and the Strava webhook can import it. Handles
// token refresh, activity import + dedup + anti-fraud screening, and recomputing
// automatic-challenge progress from stored activities.
import "server-only";

import { randomUUID } from "node:crypto";
import { getCategory } from "@/data/challenge-categories";
import { fitnessService } from "@/fitness";
import { screenActivity } from "@/fitness/fitness-utils";

import {
  ACTIVITY_SOURCE,
  CHALLENGE_STATUS,
  PROOF_TYPE,
  SUBMISSION_STATUS,
  VERIFICATION_TYPE,
} from "@/lib/constants";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { query, queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";
import { evaluateChallenge } from "@/lib/verification";

const TOKEN_SKEW_MS = 60_000; // refresh a minute early
const FIRST_SYNC_WINDOW_MS = 30 * 86_400_000; // import last 30 days on first sync
const RESYNC_OVERLAP_MS = 3_600_000; // re-scan the last hour to catch edits

/** Decrypt tokens, refreshing (and persisting) the access token if expired. */
async function ensureFreshAccessToken(account) {
  const accessToken = decryptSecret(account.accessTokenEnc);
  const refreshToken = decryptSecret(account.refreshTokenEnc);
  const expiresMs = account.tokenExpiresAt
    ? new Date(account.tokenExpiresAt).getTime()
    : null;

  const stillValid =
    accessToken &&
    (expiresMs == null || expiresMs > Date.now() + TOKEN_SKEW_MS);
  if (stillValid) return accessToken;

  if (!refreshToken) {
    throw new Error("No valid token — the account needs to be reconnected.");
  }

  const tokens = await fitnessService.refreshTokens(
    account.provider,
    refreshToken
  );
  await query(
    `UPDATE "connectedAccount"
       SET "accessTokenEnc" = $2, "refreshTokenEnc" = $3, "tokenExpiresAt" = $4, "updatedAt" = now()
     WHERE id = $1`,
    [
      account.id,
      encryptSecret(tokens.accessToken),
      encryptSecret(tokens.refreshToken || refreshToken),
      tokens.expiresAt,
    ]
  );
  return tokens.accessToken;
}

/**
 * Import new activities for a connected account (dedup by external id), screen
 * for fraud, then recompute the owner's automatic-challenge progress.
 * @returns {Promise<{ imported: number, flagged: number }>}
 */
export async function syncAccount(account) {
  if (!account?.connected) {
    return { imported: 0, flagged: 0 };
  }
  const accessToken = await ensureFreshAccessToken(account);

  const lastSynced = account.lastSyncedAt
    ? new Date(account.lastSyncedAt).getTime()
    : null;
  const afterMs =
    lastSynced != null
      ? lastSynced - RESYNC_OVERLAP_MS
      : Date.now() - FIRST_SYNC_WINDOW_MS;
  const afterEpoch = Math.floor(afterMs / 1000);

  const raw = await fitnessService.fetchActivities(account.provider, {
    accessToken,
    afterEpoch,
  });

  let imported = 0;
  let flagged = 0;
  for (const item of raw) {
    const activity = fitnessService.normalize(account.provider, item);
    if (!activity.externalActivityId || !activity.startedAt) continue;

    const screen = screenActivity(activity);
    if (screen.flagged) flagged += 1;

    await query(
      `INSERT INTO "activity"
        ("id","userId","connectedAccountId","provider","externalActivityId","activityType",
         "startedAt","endedAt","durationSeconds","distanceMeters","steps","calories",
         "source","sourceKind","flagged","flagReason","raw")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT ("provider","externalActivityId") DO UPDATE SET
         "activityType" = EXCLUDED."activityType",
         "startedAt" = EXCLUDED."startedAt",
         "endedAt" = EXCLUDED."endedAt",
         "durationSeconds" = EXCLUDED."durationSeconds",
         "distanceMeters" = EXCLUDED."distanceMeters",
         "steps" = EXCLUDED."steps",
         "calories" = EXCLUDED."calories",
         "source" = EXCLUDED."source",
         "sourceKind" = EXCLUDED."sourceKind",
         "flagged" = EXCLUDED."flagged",
         "flagReason" = EXCLUDED."flagReason",
         "raw" = EXCLUDED."raw"`,
      [
        randomUUID(),
        account.userId,
        account.id,
        account.provider,
        activity.externalActivityId,
        activity.activityType,
        activity.startedAt,
        activity.endedAt,
        activity.durationSeconds,
        activity.distanceMeters,
        activity.steps,
        activity.calories,
        activity.source,
        activity.sourceKind ?? ACTIVITY_SOURCE.IMPORTED,
        screen.flagged,
        screen.reason,
        JSON.stringify(activity.raw ?? {}),
      ]
    );
    imported += 1;
  }

  await query(
    `UPDATE "connectedAccount" SET "lastSyncedAt" = now(), "updatedAt" = now() WHERE id = $1`,
    [account.id]
  );

  await recomputeUserAutomaticChallenges(account.userId).catch((error) =>
    logger.warn("Challenge recompute failed", { message: error?.message })
  );

  logger.info("Fitness sync complete", {
    provider: account.provider,
    userId: account.userId,
    imported,
    flagged,
  });
  return { imported, flagged };
}

/**
 * Recompute progress for the user's ACTIVE automatic/hybrid challenges from
 * stored (non-flagged) activities. Marks a satisfied challenge
 * AWAITING_VERIFICATION for admin review — it never auto-declares WON.
 */
export async function recomputeUserAutomaticChallenges(userId) {
  const challenges = await query(
    `SELECT c.id, c."ownerId", c."requirementType", c."targetValue", c."frequencyPerWeek",
            c."durationDays", c."startDate", c."endDate", c.status,
            cat.slug AS "categorySlug", cat."activityType"
       FROM "challenge" c
       JOIN "challengeCategory" cat ON cat.id = c."categoryId"
      WHERE c."ownerId" = $1 AND c."deletedAt" IS NULL
        AND c.status IN ('${CHALLENGE_STATUS.ACTIVE}','${CHALLENGE_STATUS.AWAITING_VERIFICATION}')
        AND c."verificationType" IN ('${VERIFICATION_TYPE.AUTOMATIC}','${VERIFICATION_TYPE.HYBRID}')`,
    [userId]
  );
  if (!challenges.length) return;

  // Flagged (suspicious) activities are excluded until an admin clears them.
  const activities = await query(
    `SELECT "activityType","startedAt","durationSeconds","distanceMeters","steps"
       FROM "activity"
      WHERE "userId" = $1 AND COALESCE("flagged", false) = false`,
    [userId]
  );

  for (const row of challenges) {
    try {
      const category = getCategory(row.categorySlug);
      const result = evaluateChallenge(
        {
          requirementType: row.requirementType,
          targetValue: row.targetValue,
          frequencyPerWeek: row.frequencyPerWeek,
          durationDays: row.durationDays,
          startDate: row.startDate,
          endDate: row.endDate,
          activityType: row.activityType,
          metric: category?.metric,
          unit: category?.unit,
        },
        activities
      );
      if (!result.autoVerifiable) continue;

      await query(
        `UPDATE "challenge" SET "progressPercent" = $2, "progressValue" = $3
          WHERE id = $1 AND status IN ('${CHALLENGE_STATUS.ACTIVE}','${CHALLENGE_STATUS.AWAITING_VERIFICATION}')`,
        [row.id, result.progressPercent, result.progressValue]
      );

      if (result.satisfied && row.status === CHALLENGE_STATUS.ACTIVE) {
        await flagForReview(row, result);
      }
    } catch (error) {
      logger.warn("Challenge evaluation failed", {
        challengeId: row.id,
        message: error?.message,
      });
    }
  }
}

// Move a satisfied challenge into the admin verification queue, once, with a
// summarizing ACTIVITY submission. Admin still makes the WON/LOST call.
async function flagForReview(row, result) {
  const existing = await queryOne(
    `SELECT id FROM "submission" WHERE "challengeId" = $1 AND type = '${PROOF_TYPE.ACTIVITY}' LIMIT 1`,
    [row.id]
  );
  if (existing) return;

  await query(
    `UPDATE "challenge" SET status = '${CHALLENGE_STATUS.AWAITING_VERIFICATION}'
      WHERE id = $1 AND status = '${CHALLENGE_STATUS.ACTIVE}'`,
    [row.id]
  );
  await query(
    `INSERT INTO "challengeStatusHistory" ("id","challengeId","fromStatus","toStatus","changedById","note")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      randomUUID(),
      row.id,
      CHALLENGE_STATUS.ACTIVE,
      CHALLENGE_STATUS.AWAITING_VERIFICATION,
      null,
      "Auto-verification target reached",
    ]
  );
  await query(
    `INSERT INTO "submission" ("id","challengeId","userId","type","status","label","note","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7, now())`,
    [
      randomUUID(),
      row.id,
      row.ownerId,
      PROOF_TYPE.ACTIVITY,
      SUBMISSION_STATUS.PENDING,
      "Auto-verified from fitness data",
      summarize(result),
    ]
  );
}

function summarize(result) {
  const { detail = {}, metric, unit } = result;
  if (detail.daysCompleted != null) {
    return `Daily goal: ${detail.daysCompleted}/${detail.durationDays} days completed.`;
  }
  if (detail.weeksCompleted != null) {
    return `Frequency goal: ${detail.weeksCompleted}/${detail.weeks} weeks met (${detail.perWeek}/week).`;
  }
  if (detail.total != null) {
    return `Total goal: ${detail.total}/${detail.target} ${unit ?? metric}.`;
  }
  return "Auto-verification target reached.";
}
