"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { CHALLENGE_STATUS, DISPUTE_STATUS } from "@/lib/constants";
import { query, queryOne } from "@/lib/db";
import { sendDisputeOpenedEmail } from "@/lib/email";
import {
  actionOk,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  toActionError,
  ValidationError,
} from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isUuid } from "@/lib/validations";

// A result can only be disputed from a lost/under-review state.
const DISPUTABLE_FROM = [
  CHALLENGE_STATUS.LOST,
  CHALLENGE_STATUS.UNDER_REVIEW,
  CHALLENGE_STATUS.AWAITING_REVIEW,
];

/** Owner opens a dispute on a lost/under-review challenge → status DISPUTED. */
export async function OpenDispute({ challengeId, reason } = {}) {
  try {
    const user = await requireUser();
    enforceRateLimit(`dispute:${user.id}`, { limit: 5, windowMs: 600_000 });

    if (!isUuid(challengeId))
      throw new ValidationError({ challengeId: "Invalid challenge." });
    const text = String(reason ?? "").trim();
    if (text.length < 10) {
      throw new ValidationError({
        reason: "Please explain your dispute (at least 10 characters).",
      });
    }

    const challenge = await queryOne(
      `SELECT id, title, "ownerId", status FROM "challenge" WHERE id = $1 AND "deletedAt" IS NULL`,
      [challengeId]
    );
    if (!challenge) throw new NotFoundError("Challenge not found.");
    if (challenge.ownerId !== user.id)
      throw new ForbiddenError("You can only dispute your own challenge.");
    if (!DISPUTABLE_FROM.includes(challenge.status)) {
      throw new ValidationError({
        challenge: "This challenge can't be disputed right now.",
      });
    }

    const existing = await queryOne(
      `SELECT id FROM "dispute" WHERE "challengeId" = $1 AND status = 'OPEN' LIMIT 1`,
      [challengeId]
    );
    if (existing)
      throw new ConflictError("A dispute is already open for this challenge.");

    const disputeId = randomUUID();
    await query(
      `INSERT INTO "dispute" ("id","challengeId","userId","reason","status","updatedAt")
       VALUES ($1,$2,$3,$4,$5, now())`,
      [
        disputeId,
        challengeId,
        user.id,
        text.slice(0, 1000),
        DISPUTE_STATUS.OPEN,
      ]
    );
    await query(`UPDATE "challenge" SET status = $2 WHERE id = $1`, [
      challengeId,
      CHALLENGE_STATUS.DISPUTED,
    ]);
    await query(
      `INSERT INTO "challengeStatusHistory" ("id","challengeId","fromStatus","toStatus","changedById","note")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        challengeId,
        challenge.status,
        CHALLENGE_STATUS.DISPUTED,
        user.id,
        "Dispute opened",
      ]
    );
    await query(
      `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId") VALUES ($1,$2,$3,$4,$5)`,
      [randomUUID(), user.id, "DISPUTE_OPENED", "Dispute", disputeId]
    );

    await trackEvent(
      ANALYTICS_EVENT.CHALLENGE_DISPUTED,
      { challenge_id: challengeId },
      { distinctId: user.clerkId }
    );

    // Acknowledge the dispute to the user — non-blocking, best-effort.
    after(() =>
      sendDisputeOpenedEmail({
        to: user.email,
        name: user.name,
        challenge: { id: challengeId, title: challenge.title },
      })
    );

    revalidatePath(`/challenges/${challengeId}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin/disputes");
    return actionOk({ id: disputeId });
  } catch (error) {
    return toActionError(error);
  }
}
