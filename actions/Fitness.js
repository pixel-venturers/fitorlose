"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { fitnessService } from "@/fitness";
import { syncAccount } from "@/fitness/sync";

import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { DB_PROVIDER_BY_SLUG, PROVIDER_META } from "@/lib/constants";
import { signState } from "@/lib/crypto";
import { query, queryOne } from "@/lib/db";
import {
  actionOk,
  NotFoundError,
  toActionError,
  ValidationError,
} from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";

async function audit(actorId, action, entityId, metadata = null) {
  await query(
    `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId","metadata")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      randomUUID(),
      actorId,
      action,
      "ConnectedAccount",
      entityId,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

function resolveSlug(provider) {
  const slug = String(provider ?? "").toLowerCase();
  const meta = PROVIDER_META[slug];
  if (!meta)
    throw new ValidationError({ provider: "Unknown fitness provider." });
  return { slug, meta };
}

/** Begin an OAuth connection. Returns the provider consent URL to redirect to. */
export async function StartFitnessConnection({ provider } = {}) {
  try {
    const user = await requireUser();
    enforceRateLimit(`fitness-connect:${user.id}`, {
      limit: 10,
      windowMs: 600_000,
    });
    const { slug, meta } = resolveSlug(provider);

    if (!fitnessService.isSupported(slug)) {
      throw new ValidationError({
        provider: `${meta.label} can't be connected from the web yet.`,
      });
    }

    // Signed, short-lived state binds the callback to this user (CSRF-safe).
    const state = signState({ userId: user.id, provider: slug });
    const url = fitnessService.authorizeUrl(slug, {
      state,
      scopes: meta.scopes,
    });
    return actionOk({ url });
  } catch (error) {
    return toActionError(error);
  }
}

/** Disconnect a provider: drop tokens, keep historical activities (auditable). */
export async function DisconnectFitnessProvider({ provider } = {}) {
  try {
    const user = await requireUser();
    const { slug } = resolveSlug(provider);
    const dbKey = DB_PROVIDER_BY_SLUG[slug];

    const account = await queryOne(
      `SELECT id FROM "connectedAccount" WHERE "userId" = $1 AND provider = $2`,
      [user.id, dbKey]
    );
    if (!account) throw new NotFoundError("That account isn't connected.");

    await query(
      `UPDATE "connectedAccount"
         SET connected = false, "accessTokenEnc" = null, "refreshTokenEnc" = null,
             "tokenExpiresAt" = null, "updatedAt" = now()
       WHERE id = $1`,
      [account.id]
    );
    await audit(user.id, "FITNESS_DISCONNECTED", account.id, {
      provider: slug,
    });
    await trackEvent(
      ANALYTICS_EVENT.FITNESS_DISCONNECTED,
      { provider: slug },
      { distinctId: user.clerkId }
    );
    revalidatePath("/settings/connections");
    return actionOk({ provider: slug });
  } catch (error) {
    return toActionError(error);
  }
}

/** Pull new activities on demand and recompute automatic-challenge progress. */
export async function SyncFitnessActivities({ provider } = {}) {
  try {
    const user = await requireUser();
    const { slug } = resolveSlug(provider);
    enforceRateLimit(`fitness-sync:${user.id}:${slug}`, {
      limit: 6,
      windowMs: 300_000,
    });
    const dbKey = DB_PROVIDER_BY_SLUG[slug];

    const account = await queryOne(
      `SELECT * FROM "connectedAccount"
        WHERE "userId" = $1 AND provider = $2 AND connected = true`,
      [user.id, dbKey]
    );
    if (!account) throw new NotFoundError("Connect the provider first.");

    const { imported, flagged } = await syncAccount(account);
    await trackEvent(
      ANALYTICS_EVENT.ACTIVITIES_SYNCED,
      { provider: slug, imported, flagged },
      { distinctId: user.clerkId }
    );
    revalidatePath("/settings/connections");
    revalidatePath("/dashboard");
    return actionOk({ imported, flagged });
  } catch (error) {
    return toActionError(error);
  }
}
