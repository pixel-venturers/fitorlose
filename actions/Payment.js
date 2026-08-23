"use server";

import { randomUUID } from "node:crypto";
import { paymentService } from "@/payment";
import { currentUser } from "@clerk/nextjs/server";

import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import {
  CHALLENGE_STATUS,
  FITNESS_PROVIDER_LABEL,
  PAYMENT_PROVIDER,
  PAYMENT_STATUS,
  VERIFICATION_TYPE,
} from "@/lib/constants";
import { query, queryOne } from "@/lib/db";
import {
  actionOk,
  ForbiddenError,
  NotFoundError,
  toActionError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isUuid } from "@/lib/validations";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * Start (or resume) checkout for a PAYMENT_PENDING challenge. Creates a PENDING
 * payment row and a single-use Dodo checkout session; the browser opens it as an
 * overlay. The challenge is only activated later by the verified webhook.
 */
export async function CreateCheckout({ challengeId } = {}) {
  try {
    const user = await requireUser();
    enforceRateLimit(`checkout:${user.id}`, { limit: 12, windowMs: 600_000 });
    if (!isUuid(challengeId))
      throw new ValidationError({ challengeId: "Invalid challenge." });

    const challenge = await queryOne(
      `SELECT id, "ownerId", title, amount, currency, status, "startDate", "endDate",
              "verificationType", "verificationProvider"
       FROM "challenge" WHERE id = $1 AND "deletedAt" IS NULL`,
      [challengeId]
    );
    if (!challenge) throw new NotFoundError("Challenge not found.");
    if (challenge.ownerId !== user.id)
      throw new ForbiddenError("You don't own this challenge.");
    if (challenge.status !== CHALLENGE_STATUS.PAYMENT_PENDING) {
      throw new ValidationError({
        challenge: "This challenge isn't awaiting payment.",
      });
    }

    // Model A: a pending "cart" can be resumed later — but only while its window
    // is still valid. Refuse payment once the challenge's end date has passed.
    const now = Date.now();
    const endMs = challenge.endDate
      ? new Date(challenge.endDate).getTime()
      : null;
    if (endMs != null && endMs <= now) {
      throw new ValidationError({
        challenge:
          "This challenge's window has already passed — please create a new one.",
      });
    }

    // Verification before activation: an automatic challenge can't be paid for
    // until its fitness provider is actually connected (PLAN.md).
    if (
      challenge.verificationType === VERIFICATION_TYPE.AUTOMATIC &&
      challenge.verificationProvider
    ) {
      const connected = await queryOne(
        `SELECT id FROM "connectedAccount"
          WHERE "userId" = $1 AND provider = $2 AND connected = true`,
        [user.id, challenge.verificationProvider]
      );
      if (!connected) {
        const label =
          FITNESS_PROVIDER_LABEL[challenge.verificationProvider] ??
          challenge.verificationProvider;
        throw new ValidationError({
          challenge: `Connect ${label} in Settings → Fitness connections before activating this automatic challenge.`,
        });
      }
    }

    const clerk = await currentUser();
    const email =
      clerk?.primaryEmailAddress?.emailAddress ??
      clerk?.emailAddresses?.[0]?.emailAddress ??
      null;
    if (!email)
      throw new ValidationError({
        email: "A verified email is required to pay.",
      });

    const paymentId = randomUUID();
    const idempotencyKey = `pay_${challengeId}_${paymentId.slice(0, 8)}`;
    await query(
      `INSERT INTO "payment"
        ("id","challengeId","userId","provider","type","amount","currency","status","idempotencyKey","updatedAt")
       VALUES ($1,$2,$3,$4,'COMMITMENT',$5,$6,$7,$8, now())`,
      [
        paymentId,
        challengeId,
        user.id,
        PAYMENT_PROVIDER.DODO,
        challenge.amount,
        challenge.currency,
        PAYMENT_STATUS.PENDING,
        idempotencyKey,
      ]
    );

    const { sessionId, checkoutUrl } = await paymentService.createCheckout({
      amount: challenge.amount,
      currency: challenge.currency,
      customer: { email, name: user.name },
      returnUrl: `${appUrl()}/challenges/${challengeId}?payment=processing`,
      metadata: { challengeId, userId: user.id, paymentId },
    });

    await query(
      `UPDATE "payment" SET "providerOrderId" = $2, "updatedAt" = now() WHERE id = $1`,
      [paymentId, sessionId]
    );
    await query(
      `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId","metadata") VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        user.id,
        "CHECKOUT_CREATED",
        "Payment",
        paymentId,
        JSON.stringify({ challengeId, sessionId }),
      ]
    );
    await trackEvent(
      ANALYTICS_EVENT.PAYMENT_STARTED,
      {
        challenge_id: challengeId,
        payment_id: paymentId,
        amount: Number(challenge.amount),
        currency: challenge.currency,
        provider: "dodo",
      },
      { distinctId: user.clerkId }
    );
    logger.info("Checkout session created", {
      challengeId,
      paymentId,
      sessionId,
    });
    return actionOk({ checkoutUrl, sessionId, paymentId });
  } catch (error) {
    return toActionError(error);
  }
}
