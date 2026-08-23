// Dodo Payments webhook — the authoritative source for payment state. Verifies
// the Standard Webhooks signature, is idempotent (webhook-id + a unique
// commitment key + a row lock), and never trusts the browser. On payment success
// it activates the challenge (SCHEDULED if it starts in the future, else ACTIVE).
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { paymentService } from "@/payment";

import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics";
import {
  CHALLENGE_STATUS,
  PAYMENT_STATUS,
  TRANSACTION_TYPE,
} from "@/lib/constants";
import { query, queryOne, withTransaction } from "@/lib/db";
import { sendChallengeCreatedEmail, sendPaymentAdminEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const rawBody = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
  };

  let event;
  try {
    event = paymentService.verifyWebhook(rawBody, headers);
  } catch (error) {
    logger.warn("Dodo webhook signature verification failed", {
      message: error?.message,
    });
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    await handleEvent(event, headers["webhook-id"]);
  } catch (error) {
    logger.error("Dodo webhook processing failed", {
      message: error?.message,
      type: event?.type,
    });
    // Non-2xx makes Dodo retry with backoff.
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ received: true }, { status: 200 });
}

async function alreadyProcessed(webhookId) {
  if (!webhookId) return false;
  const seen = await queryOne(
    `SELECT id FROM "auditLog" WHERE action = 'DODO_WEBHOOK' AND "entityId" = $1 LIMIT 1`,
    [webhookId]
  );
  return Boolean(seen);
}

async function recordWebhook(
  client,
  { webhookId, type, challengeId, actorId = null }
) {
  const run = client ?? { query };
  await run.query(
    `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId","metadata")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      randomUUID(),
      actorId,
      "DODO_WEBHOOK",
      "Payment",
      webhookId,
      JSON.stringify({ type, challengeId }),
    ]
  );
}

async function handleEvent(event, webhookId) {
  const type = event?.type;
  const data = event?.data ?? {};
  if (data.payload_type && data.payload_type !== "Payment") return;

  const metadata = data.metadata ?? {};
  const challengeId = metadata.challengeId ?? null;
  const paymentId = metadata.paymentId ?? null;
  const providerPaymentId = data.payment_id ?? null;
  const phone = data.customer?.phone_number ?? null;
  const billing = data.billing ?? null;

  if (await alreadyProcessed(webhookId)) return;

  // Critical, idempotent DB work first.
  if (type === "payment.succeeded") {
    await activatePaidChallenge({
      challengeId,
      paymentId,
      providerPaymentId,
      phone,
      billing,
      event,
      webhookId,
    });
  } else if (type === "payment.failed" || type === "payment.cancelled") {
    const nextStatus =
      type === "payment.failed"
        ? PAYMENT_STATUS.FAILED
        : PAYMENT_STATUS.CANCELLED;
    if (paymentId) {
      await query(
        `UPDATE "payment" SET status = $2, "providerPaymentId" = COALESCE($3, "providerPaymentId"),
           "rawWebhook" = $4, "updatedAt" = now()
         WHERE id = $1 AND status IN ('PENDING','PROCESSING')`,
        [paymentId, nextStatus, providerPaymentId, JSON.stringify(event)]
      );
    }
    await recordWebhook(null, { webhookId, type, challengeId });
  } else {
    // Other payment.* events: acknowledge + record for idempotency.
    await recordWebhook(null, { webhookId, type, challengeId });
    return;
  }

  // Best-effort side effects — analytics + detailed admin email. Never throws.
  await notify({ type, event, challengeId, providerPaymentId, data, metadata });
}

async function loadPaymentContext(challengeId) {
  if (!challengeId) return { challenge: null, clerkId: null, owner: null };
  try {
    const row = await queryOne(
      `SELECT c.id, c.title, c.currency, c.amount, u."clerkId" AS "clerkId",
              u.email AS "ownerEmail", u.name AS "ownerName"
       FROM "challenge" c JOIN "user" u ON u.id = c."ownerId" WHERE c.id = $1`,
      [challengeId]
    );
    if (!row) return { challenge: null, clerkId: null, owner: null };
    return {
      challenge: {
        id: row.id,
        title: row.title,
        currency: row.currency,
        amount: row.amount,
      },
      clerkId: row.clerkId,
      owner: { email: row.ownerEmail, name: row.ownerName },
    };
  } catch {
    return { challenge: null, clerkId: null, owner: null };
  }
}

async function notify({
  type,
  event,
  challengeId,
  providerPaymentId,
  data,
  metadata,
}) {
  try {
    const { challenge, clerkId, owner } = await loadPaymentContext(challengeId);
    const distinctId = clerkId || metadata.userId || "server";
    const amount =
      data.total_amount != null
        ? Number(data.total_amount) / 100
        : (challenge?.amount ?? null);
    const currency = data.currency ?? challenge?.currency ?? null;

    await trackEvent(
      ANALYTICS_EVENT.PAYMENT_WEBHOOK_RECEIVED,
      {
        type,
        challenge_id: challengeId,
        payment_id: providerPaymentId,
        currency,
      },
      { distinctId }
    );

    if (type === "payment.succeeded") {
      await trackEvent(
        ANALYTICS_EVENT.PAYMENT_SUCCEEDED,
        {
          challenge_id: challengeId,
          payment_id: providerPaymentId,
          amount,
          currency,
          provider: "dodo",
        },
        { distinctId }
      );
      await sendPaymentAdminEmail({ kind: "succeeded", event, challenge });
      if (owner?.email && challenge) {
        // Motivational "you're locked in" mail to the owner — non-blocking.
        after(() =>
          sendChallengeCreatedEmail({
            to: owner.email,
            name: owner.name,
            challenge,
          })
        );
      }
    } else if (type === "payment.failed") {
      await trackEvent(
        ANALYTICS_EVENT.PAYMENT_FAILED,
        {
          challenge_id: challengeId,
          payment_id: providerPaymentId,
          amount,
          currency,
          error_code: data.error_code ?? null,
          provider: "dodo",
        },
        { distinctId }
      );
      await sendPaymentAdminEmail({ kind: "failed", event, challenge });
    } else if (type === "payment.cancelled") {
      await trackEvent(
        ANALYTICS_EVENT.PAYMENT_CANCELLED,
        {
          challenge_id: challengeId,
          payment_id: providerPaymentId,
          amount,
          currency,
          provider: "dodo",
        },
        { distinctId }
      );
      await sendPaymentAdminEmail({ kind: "cancelled", event, challenge });
    }
  } catch (error) {
    logger.warn("Payment webhook notify failed", {
      type,
      message: error?.message,
    });
  }
}

async function activatePaidChallenge({
  challengeId,
  paymentId,
  providerPaymentId,
  phone,
  billing,
  event,
  webhookId,
}) {
  await withTransaction(async (client) => {
    if (paymentId) {
      await client.query(
        `UPDATE "payment" SET status = 'SUCCEEDED', "providerPaymentId" = COALESCE($2, "providerPaymentId"),
           "phone" = $4, "billingAddress" = $5, "rawWebhook" = $3, "updatedAt" = now()
         WHERE id = $1`,
        [
          paymentId,
          providerPaymentId,
          JSON.stringify(event),
          phone,
          billing ? JSON.stringify(billing) : null,
        ]
      );
    }

    if (!challengeId) {
      await recordWebhook(client, {
        webhookId,
        type: "payment.succeeded",
        challengeId: null,
      });
      return;
    }

    const { rows } = await client.query(
      `SELECT id, "ownerId", amount, currency, status, "startDate"
       FROM "challenge" WHERE id = $1 AND "deletedAt" IS NULL FOR UPDATE`,
      [challengeId]
    );
    const challenge = rows[0];

    if (challenge && phone) {
      await client.query(
        `UPDATE "user" SET phone = $2, "updatedAt" = now() WHERE id = $1`,
        [challenge.ownerId, phone]
      );
    }

    if (challenge && challenge.status === CHALLENGE_STATUS.PAYMENT_PENDING) {
      const now = Date.now();
      const startMs = challenge.startDate
        ? new Date(challenge.startDate).getTime()
        : null;
      const nextStatus =
        startMs && startMs > now
          ? CHALLENGE_STATUS.SCHEDULED
          : CHALLENGE_STATUS.ACTIVE;

      await client.query(
        `UPDATE "challenge" SET status = $2, "updatedAt" = now() WHERE id = $1`,
        [challengeId, nextStatus]
      );
      await client.query(
        `INSERT INTO "challengeStatusHistory" ("id","challengeId","fromStatus","toStatus","note")
         VALUES ($1,$2,$3,$4,$5)`,
        [
          randomUUID(),
          challengeId,
          CHALLENGE_STATUS.PAYMENT_PENDING,
          nextStatus,
          "Payment received",
        ]
      );
      // One commitment transaction per challenge — unique key blocks duplicates.
      await client.query(
        `INSERT INTO "transaction"
          ("id","challengeId","userId","paymentId","type","amount","currency","status","reference","idempotencyKey","note","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,'SUCCEEDED',$8,$9,$10, now())
         ON CONFLICT ("idempotencyKey") DO NOTHING`,
        [
          randomUUID(),
          challengeId,
          challenge.ownerId,
          paymentId,
          TRANSACTION_TYPE.COMMITMENT,
          challenge.amount,
          challenge.currency,
          providerPaymentId,
          `commit_${challengeId}`,
          "Challenge commitment",
        ]
      );
    }

    await recordWebhook(client, {
      webhookId,
      type: "payment.succeeded",
      challengeId,
      actorId: challenge?.ownerId ?? null,
    });
  });
}
