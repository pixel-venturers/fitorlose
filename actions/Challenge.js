"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getCategory } from "@/data/challenge-categories";

import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { CHALLENGE_STATUS, SUBMISSION_STATUS } from "@/lib/constants";
import { query, queryOne } from "@/lib/db";
import { sendProofSubmittedEmail } from "@/lib/email";
import {
  actionOk,
  ForbiddenError,
  NotFoundError,
  toActionError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  canDeleteChallenge,
  canEditChallenge,
  canSubmitProof,
} from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateCreateChallenge, validateSubmission } from "@/lib/validations";

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function loadOwnedChallenge(id) {
  const row = await queryOne(
    `SELECT id, title, "ownerId", status, visibility FROM "challenge" WHERE id = $1 AND "deletedAt" IS NULL`,
    [id]
  );
  if (!row) throw new NotFoundError("Challenge not found.");
  return row;
}

/** Create a challenge in PAYMENT_PENDING. Phase 4 payment activates it. */
export async function CreateChallenge(input) {
  try {
    const user = await requireUser();
    enforceRateLimit(`challenge-create:${user.id}`, {
      limit: 10,
      windowMs: 600_000,
    });

    const parsed = validateCreateChallenge(input);
    if (!parsed.success) throw new ValidationError(parsed.fieldErrors);
    const data = parsed.data;

    const category = getCategory(data.categorySlug);
    const categoryRow = await queryOne(
      `SELECT id FROM "challengeCategory" WHERE slug = $1`,
      [data.categorySlug]
    );
    if (!categoryRow)
      throw new ValidationError({ categorySlug: "Unknown category." });

    const id = randomUUID();
    const slug = `${slugify(data.title)}-${id.slice(0, 8)}`;
    const startDate = data.startDate ?? new Date();
    const endDate = new Date(
      startDate.getTime() + data.durationDays * 86_400_000
    );

    await query(
      `INSERT INTO "challenge"
        ("id","slug","title","description","ownerId","categoryId","visibility","verificationType",
         "requirementType","startingValue","targetValue","unit","status","amount","currency",
         "startDate","endDate","durationDays","coverGradient","progressPercent","progressValue",
         "verificationProvider","coverImageUrl","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23, now())`,
      [
        id,
        slug,
        data.title,
        data.description,
        user.id,
        categoryRow.id,
        data.visibility,
        data.verificationType,
        data.requirementType,
        data.startingValue,
        data.targetValue,
        data.unit ?? category?.unit ?? null,
        CHALLENGE_STATUS.PAYMENT_PENDING,
        data.amount,
        data.currency,
        startDate,
        endDate,
        data.durationDays,
        category?.gradient ?? null,
        0,
        data.startingValue ?? 0,
        data.verificationProvider ?? null,
        data.coverImageUrl ?? null,
      ]
    );

    await query(
      `INSERT INTO "challengeStatusHistory" ("id","challengeId","fromStatus","toStatus","changedById","note")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        id,
        null,
        CHALLENGE_STATUS.PAYMENT_PENDING,
        user.id,
        "Challenge created",
      ]
    );
    await query(
      `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId") VALUES ($1,$2,$3,$4,$5)`,
      [randomUUID(), user.id, "CHALLENGE_CREATED", "Challenge", id]
    );

    await trackEvent(
      ANALYTICS_EVENT.CHALLENGE_CREATED,
      {
        challenge_id: id,
        challenge_category: data.categorySlug,
        challenge_duration: data.durationDays,
        commitment_amount: Number(data.amount),
        currency: data.currency,
        visibility: data.visibility,
        verification_type: data.verificationType,
      },
      { distinctId: user.clerkId }
    );

    revalidatePath("/dashboard");
    revalidatePath("/");
    logger.info("Challenge created", { id, ownerId: user.id });
    return actionOk({ id, slug });
  } catch (error) {
    return toActionError(error);
  }
}

/** Update non-financial fields, and only while the challenge isn't active yet. */
export async function UpdateChallenge(id, input) {
  try {
    const user = await requireUser();
    const challenge = await loadOwnedChallenge(id);
    if (!canEditChallenge(user, challenge)) {
      throw new ForbiddenError("This challenge can no longer be edited.");
    }

    const description = input?.description
      ? String(input.description).slice(0, 2000)
      : null;
    const title = input?.title
      ? String(input.title).trim().slice(0, 120)
      : null;
    if (title !== null && title.length < 3)
      throw new ValidationError({ title: "Title is too short." });

    await query(
      `UPDATE "challenge" SET
         "title" = COALESCE($2, "title"),
         "description" = COALESCE($3, "description")
       WHERE id = $1`,
      [id, title, description]
    );
    await query(
      `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId") VALUES ($1,$2,$3,$4,$5)`,
      [randomUUID(), user.id, "CHALLENGE_UPDATED", "Challenge", id]
    );

    revalidatePath(`/challenges/${id}`);
    revalidatePath("/dashboard");
    return actionOk({ id });
  } catch (error) {
    return toActionError(error);
  }
}

/** Soft-delete a challenge (owner while pre-active, or admin). */
export async function DeleteChallenge(id) {
  try {
    const user = await requireUser();
    const challenge = await loadOwnedChallenge(id);
    if (!canDeleteChallenge(user, challenge)) {
      throw new ForbiddenError("This challenge can't be deleted.");
    }
    await query(`UPDATE "challenge" SET "deletedAt" = now() WHERE id = $1`, [
      id,
    ]);
    await query(
      `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId") VALUES ($1,$2,$3,$4,$5)`,
      [randomUUID(), user.id, "CHALLENGE_DELETED", "Challenge", id]
    );
    revalidatePath("/dashboard");
    return actionOk({ id });
  } catch (error) {
    return toActionError(error);
  }
}

/** Submit proof for a manual/hybrid challenge; moves it to AWAITING_VERIFICATION. */
export async function SubmitProof(input) {
  try {
    const user = await requireUser();
    enforceRateLimit(`proof-submit:${user.id}`, {
      limit: 20,
      windowMs: 600_000,
    });

    const parsed = validateSubmission(input);
    if (!parsed.success) throw new ValidationError(parsed.fieldErrors);
    const data = parsed.data;

    const challenge = await loadOwnedChallenge(data.challengeId);
    if (!canSubmitProof(user, challenge)) {
      throw new ForbiddenError("You can't submit proof for this challenge.");
    }

    const submissionId = randomUUID();
    await query(
      `INSERT INTO "submission" ("id","challengeId","userId","type","status","fileUrl","label","note","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
      [
        submissionId,
        data.challengeId,
        user.id,
        data.type,
        SUBMISSION_STATUS.PENDING,
        data.fileUrl,
        data.label,
        data.note,
      ]
    );

    if (challenge.status === CHALLENGE_STATUS.ACTIVE) {
      await query(`UPDATE "challenge" SET status = $2 WHERE id = $1`, [
        data.challengeId,
        CHALLENGE_STATUS.AWAITING_VERIFICATION,
      ]);
      await query(
        `INSERT INTO "challengeStatusHistory" ("id","challengeId","fromStatus","toStatus","changedById","note")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          randomUUID(),
          data.challengeId,
          CHALLENGE_STATUS.ACTIVE,
          CHALLENGE_STATUS.AWAITING_VERIFICATION,
          user.id,
          "Proof submitted",
        ]
      );
    }

    await query(
      `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId","metadata") VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        user.id,
        "PROOF_SUBMITTED",
        "Submission",
        submissionId,
        JSON.stringify({ challengeId: data.challengeId, type: data.type }),
      ]
    );

    await trackEvent(
      ANALYTICS_EVENT.PROOF_SUBMITTED,
      {
        challenge_id: data.challengeId,
        submission_id: submissionId,
        type: data.type,
      },
      { distinctId: user.clerkId }
    );

    // Acknowledge the submission to the user — non-blocking, best-effort.
    after(() =>
      sendProofSubmittedEmail({
        to: user.email,
        name: user.name,
        challenge: { id: data.challengeId, title: challenge.title },
      })
    );

    revalidatePath(`/challenges/${data.challengeId}`);
    revalidatePath("/dashboard");
    return actionOk({ id: submissionId });
  } catch (error) {
    return toActionError(error);
  }
}
