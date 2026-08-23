"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { paymentService } from "@/payment";

import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics";
import { requireAdmin } from "@/lib/auth";
import {
  CHALLENGE_STATUS,
  DISPUTE_STATUS,
  PAYMENT_STATUS,
  SETTLEMENT_STATUS,
  SUBMISSION_STATUS,
  TRANSACTION_TYPE,
} from "@/lib/constants";
import { query, queryOne, withTransaction } from "@/lib/db";
import { sendRewardEmail, sendSubmissionReviewedEmail } from "@/lib/email";
import {
  actionOk,
  NotFoundError,
  toActionError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { isUuid } from "@/lib/validations";

async function audit(actorId, action, entityType, entityId, metadata = null) {
  await query(
    `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId","metadata") VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      randomUUID(),
      actorId,
      action,
      entityType,
      entityId,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

// Attribute a lifecycle event to the challenge owner (matches client identify).
async function trackForUser(userDbId, event, properties) {
  try {
    const row = userDbId
      ? await queryOne(`SELECT "clerkId" FROM "user" WHERE id = $1`, [userDbId])
      : null;
    await trackEvent(event, properties, {
      distinctId: row?.clerkId || userDbId || "server",
    });
  } catch {
    /* analytics is best-effort */
  }
}

/** Approve or reject a proof submission. */
export async function ReviewSubmission({ submissionId, decision } = {}) {
  try {
    const admin = await requireAdmin();
    if (!isUuid(submissionId))
      throw new ValidationError({ submissionId: "Invalid submission." });

    const status =
      decision === "approve"
        ? SUBMISSION_STATUS.VERIFIED
        : SUBMISSION_STATUS.REJECTED;
    const submission = await queryOne(
      `SELECT s.id, s."challengeId", s."userId",
              u.email AS "userEmail", u.name AS "userName",
              c.title AS "challengeTitle"
       FROM "submission" s
       JOIN "user" u ON u.id = s."userId"
       JOIN "challenge" c ON c.id = s."challengeId"
       WHERE s.id = $1`,
      [submissionId]
    );
    if (!submission) throw new NotFoundError("Submission not found.");

    await query(
      `UPDATE "submission" SET status = $2, "reviewedById" = $3, "reviewedAt" = now() WHERE id = $1`,
      [submissionId, status, admin.id]
    );

    if (status === SUBMISSION_STATUS.VERIFIED) {
      await query(
        `UPDATE "challenge" SET status = $2 WHERE id = $1 AND status IN ('AWAITING_VERIFICATION','UNDER_REVIEW')`,
        [submission.challengeId, CHALLENGE_STATUS.VERIFIED]
      );
    } else {
      await query(
        `UPDATE "challenge" SET status = $2 WHERE id = $1 AND status = 'AWAITING_VERIFICATION'`,
        [submission.challengeId, CHALLENGE_STATUS.UNDER_REVIEW]
      );
    }

    await audit(
      admin.id,
      status === SUBMISSION_STATUS.VERIFIED
        ? "SUBMISSION_APPROVED"
        : "SUBMISSION_REJECTED",
      "Submission",
      submissionId
    );
    if (status === SUBMISSION_STATUS.VERIFIED) {
      await trackForUser(
        submission.userId,
        ANALYTICS_EVENT.CHALLENGE_VERIFIED,
        {
          challenge_id: submission.challengeId,
          submission_id: submissionId,
        }
      );
    }
    // Inform the user of the review outcome — non-blocking, best-effort.
    after(() =>
      sendSubmissionReviewedEmail({
        to: submission.userEmail,
        name: submission.userName,
        challenge: {
          id: submission.challengeId,
          title: submission.challengeTitle,
        },
        decision: status === SUBMISSION_STATUS.VERIFIED ? "approve" : "reject",
      })
    );
    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    return actionOk({ id: submissionId, status });
  } catch (error) {
    return toActionError(error);
  }
}

// A final outcome may only be set from a live/under-review state — never from a
// terminal one (prevents regressing SETTLED/WON/LOST or double-processing).
const OUTCOME_ALLOWED_FROM = [
  CHALLENGE_STATUS.ACTIVE,
  CHALLENGE_STATUS.AWAITING_VERIFICATION,
  CHALLENGE_STATUS.UNDER_REVIEW,
  CHALLENGE_STATUS.AWAITING_REVIEW,
  CHALLENGE_STATUS.VERIFIED,
  CHALLENGE_STATUS.DISPUTED,
];

/** Mark a verified challenge WON or LOST. WON queues a settlement. */
export async function SetChallengeOutcome({ challengeId, outcome } = {}) {
  try {
    const admin = await requireAdmin();
    if (!isUuid(challengeId))
      throw new ValidationError({ challengeId: "Invalid challenge." });
    if (![CHALLENGE_STATUS.WON, CHALLENGE_STATUS.LOST].includes(outcome)) {
      throw new ValidationError({ outcome: "Outcome must be WON or LOST." });
    }

    const challenge = await queryOne(
      `SELECT id, "ownerId", amount, currency, status FROM "challenge" WHERE id = $1 AND "deletedAt" IS NULL`,
      [challengeId]
    );
    if (!challenge) throw new NotFoundError("Challenge not found.");
    if (!OUTCOME_ALLOWED_FROM.includes(challenge.status)) {
      throw new ValidationError({
        outcome: `A challenge in ${challenge.status} can't be marked ${outcome}.`,
      });
    }

    await withTransaction(async (client) => {
      await client.query(`UPDATE "challenge" SET status = $2 WHERE id = $1`, [
        challengeId,
        outcome,
      ]);
      await client.query(
        `INSERT INTO "challengeStatusHistory" ("id","challengeId","fromStatus","toStatus","changedById","note")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          randomUUID(),
          challengeId,
          challenge.status,
          outcome,
          admin.id,
          `Marked ${outcome} by admin`,
        ]
      );
      if (outcome === CHALLENGE_STATUS.WON) {
        await client.query(
          `INSERT INTO "settlement" ("id","challengeId","userId","amount","currency","result","status","idempotencyKey","verifiedAt","updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now())
           ON CONFLICT ("challengeId") DO NOTHING`,
          [
            randomUUID(),
            challengeId,
            challenge.ownerId,
            challenge.amount,
            challenge.currency,
            CHALLENGE_STATUS.WON,
            SETTLEMENT_STATUS.PENDING,
            `stl_${challengeId}`,
          ]
        );
      }
    });

    await audit(admin.id, `CHALLENGE_${outcome}`, "Challenge", challengeId);
    await trackForUser(
      challenge.ownerId,
      outcome === CHALLENGE_STATUS.WON
        ? ANALYTICS_EVENT.CHALLENGE_WON
        : ANALYTICS_EVENT.CHALLENGE_LOST,
      {
        challenge_id: challengeId,
        amount: Number(challenge.amount),
        currency: challenge.currency,
      }
    );
    revalidatePath("/admin");
    revalidatePath(`/challenges/${challengeId}`);
    return actionOk({ id: challengeId, status: outcome });
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Process a settlement reward. Idempotent and transaction-guarded: a reward is
 * never sent twice, even under duplicate/concurrent calls (row lock + status
 * check + unique idempotency key).
 */
export async function ProcessSettlement({ settlementId } = {}) {
  try {
    const admin = await requireAdmin();
    if (!isUuid(settlementId))
      throw new ValidationError({ settlementId: "Invalid settlement." });

    // Guard against re-processing before we ever touch the gateway.
    const existing = await queryOne(
      `SELECT status, "challengeId" FROM "settlement" WHERE id = $1`,
      [settlementId]
    );
    if (!existing) throw new NotFoundError("Settlement not found.");
    if (existing.status === SETTLEMENT_STATUS.SETTLED) {
      revalidatePath("/admin/settlements");
      revalidatePath("/admin");
      return actionOk({ id: settlementId, alreadySettled: true });
    }

    // The reward is paid by refunding the winner's original commitment payment,
    // so a single id is shared between our ledger and Dodo.
    const payment = await queryOne(
      `SELECT id, "providerPaymentId" FROM "payment"
       WHERE "challengeId" = $1 AND status = 'SUCCEEDED'
         AND "providerPaymentId" IS NOT NULL
       ORDER BY "createdAt" DESC LIMIT 1`,
      [existing.challengeId]
    );
    if (!payment?.providerPaymentId) {
      throw new ValidationError({
        settlement:
          "No settled payment is available to refund for this challenge.",
      });
    }

    // Real gateway payout. Idempotent per settlement — a retry returns the same
    // refund instead of paying twice. Throwing here leaves the settlement
    // PENDING and safely retryable.
    const refund = await paymentService.refundPayment({
      paymentId: payment.providerPaymentId,
      idempotencyKey: `refund_${settlementId}`,
      reason: "FitOrLose challenge reward",
    });
    if (refund.status === "failed") {
      throw new ValidationError({
        settlement: "The payment gateway rejected the refund. Please retry.",
      });
    }

    const result = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM "settlement" WHERE id = $1 FOR UPDATE`,
        [settlementId]
      );
      const settlement = rows[0];
      if (!settlement) throw new NotFoundError("Settlement not found.");
      if (settlement.status === SETTLEMENT_STATUS.SETTLED) {
        return { id: settlementId, alreadySettled: true };
      }

      const rewardTxnId = randomUUID();
      await client.query(
        `INSERT INTO "transaction"
          ("id","challengeId","userId","paymentId","type","amount","currency","status","reference","idempotencyKey","note","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
         ON CONFLICT ("idempotencyKey") DO NOTHING`,
        [
          rewardTxnId,
          settlement.challengeId,
          settlement.userId,
          payment.id,
          TRANSACTION_TYPE.REWARD,
          settlement.amount,
          settlement.currency,
          PAYMENT_STATUS.REWARDED,
          refund.refundId,
          `stltxn_${settlementId}`,
          "Reward for won challenge",
        ]
      );
      await client.query(
        `UPDATE "settlement" SET status = $2, "settledAt" = now(), "transactionId" = $3, "processedById" = $4 WHERE id = $1`,
        [settlementId, SETTLEMENT_STATUS.SETTLED, rewardTxnId, admin.id]
      );
      await client.query(
        `UPDATE "challenge" SET status = $2, "settledAt" = now() WHERE id = $1`,
        [settlement.challengeId, CHALLENGE_STATUS.SETTLED]
      );
      // Reflect the gateway refund on the original commitment payment.
      await client.query(
        `UPDATE "payment" SET status = $2, "updatedAt" = now() WHERE id = $1`,
        [payment.id, PAYMENT_STATUS.REFUNDED]
      );
      await client.query(
        `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId","metadata") VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          randomUUID(),
          admin.id,
          "SETTLEMENT_PROCESSED",
          "Settlement",
          settlementId,
          JSON.stringify({
            amount: Number(settlement.amount),
            currency: settlement.currency,
            transactionId: rewardTxnId,
            refundId: refund.refundId,
          }),
        ]
      );
      return {
        id: settlementId,
        transactionId: rewardTxnId,
        refundId: refund.refundId,
        userId: settlement.userId,
        challengeId: settlement.challengeId,
        amount: Number(settlement.amount),
        currency: settlement.currency,
      };
    });

    logger.info("Settlement processed", {
      settlementId,
      admin: admin.id,
      refundId: refund.refundId,
    });
    if (!result.alreadySettled) {
      await trackForUser(result.userId, ANALYTICS_EVENT.REWARD_SETTLED, {
        challenge_id: result.challengeId,
        settlement_id: settlementId,
        amount: result.amount,
        currency: result.currency,
      });
      // Congratulate the winner — non-blocking, best-effort.
      const recipient = await queryOne(
        `SELECT u.email AS "email", u.name AS "name", c.title AS "title"
         FROM "user" u, "challenge" c WHERE u.id = $1 AND c.id = $2`,
        [result.userId, result.challengeId]
      );
      if (recipient?.email) {
        after(() =>
          sendRewardEmail({
            to: recipient.email,
            name: recipient.name,
            challenge: { id: result.challengeId, title: recipient.title },
            amount: result.amount,
            currency: result.currency,
          })
        );
      }
    }
    revalidatePath("/admin/settlements");
    revalidatePath("/admin");
    return actionOk(result);
  } catch (error) {
    return toActionError(error);
  }
}

/** Resolve or reject a dispute. */
export async function ResolveDispute({ disputeId, decision, resolution } = {}) {
  try {
    const admin = await requireAdmin();
    if (!isUuid(disputeId))
      throw new ValidationError({ disputeId: "Invalid dispute." });

    const status =
      decision === "reject" ? DISPUTE_STATUS.REJECTED : DISPUTE_STATUS.RESOLVED;
    const dispute = await queryOne(
      `SELECT id, "challengeId" FROM "dispute" WHERE id = $1`,
      [disputeId]
    );
    if (!dispute) throw new NotFoundError("Dispute not found.");

    await query(
      `UPDATE "dispute" SET status = $2, resolution = $3, "resolvedById" = $4, "resolvedAt" = now() WHERE id = $1`,
      [
        disputeId,
        status,
        resolution ? String(resolution).slice(0, 1000) : null,
        admin.id,
      ]
    );
    // Route the challenge back into the pipeline: resolved → re-review,
    // rejected → the loss stands.
    const nextChallengeStatus =
      status === DISPUTE_STATUS.RESOLVED
        ? CHALLENGE_STATUS.UNDER_REVIEW
        : CHALLENGE_STATUS.LOST;
    await query(
      `UPDATE "challenge" SET status = $2 WHERE id = $1 AND status = $3`,
      [dispute.challengeId, nextChallengeStatus, CHALLENGE_STATUS.DISPUTED]
    );
    await query(
      `INSERT INTO "challengeStatusHistory" ("id","challengeId","fromStatus","toStatus","changedById","note")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        dispute.challengeId,
        CHALLENGE_STATUS.DISPUTED,
        nextChallengeStatus,
        admin.id,
        `Dispute ${status.toLowerCase()}`,
      ]
    );
    await audit(admin.id, "DISPUTE_RESOLVED", "Dispute", disputeId, { status });

    revalidatePath("/admin/disputes");
    revalidatePath("/admin");
    revalidatePath(`/challenges/${dispute.challengeId}`);
    return actionOk({ id: disputeId, status });
  } catch (error) {
    return toActionError(error);
  }
}
