// Provider-agnostic fitness OAuth callback (Strava, Fitbit, …). Verifies the
// signed state (CSRF), exchanges the code for tokens server-side, stores them
// encrypted, and kicks off an initial sync. Tokens never reach the browser.
import { randomUUID } from "node:crypto";
import { fitnessService } from "@/fitness";
import { syncAccount } from "@/fitness/sync";

import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics";
import { PROVIDER_META } from "@/lib/constants";
import { encryptSecret, verifyState } from "@/lib/crypto";
import { query, queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect(request, params) {
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const url = new URL("/settings/connections", base);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, value);
  }
  return Response.redirect(url.toString(), 302);
}

export async function GET(request, { params }) {
  const { provider: slug } = await params;
  const { searchParams } = new URL(request.url);

  // Unknown or non-web provider → nothing to do.
  if (!PROVIDER_META[slug] || !fitnessService.isSupported(slug)) {
    return redirect(request, { error: "provider" });
  }
  if (searchParams.get("error")) {
    return redirect(request, { error: "denied" });
  }

  const code = searchParams.get("code");
  const state = verifyState(searchParams.get("state"));
  if (!code || !state || state.provider !== slug) {
    return redirect(request, { error: "state" });
  }

  const dbKey = fitnessService.dbKey(slug);

  try {
    const tokens = await fitnessService.exchangeCode(slug, code);
    // Strava returns granted scopes on the callback; Fitbit returns them in the
    // token response — accept whichever is present.
    const scope = tokens.scopes ?? searchParams.get("scope");

    const account = await queryOne(
      `INSERT INTO "connectedAccount"
        ("id","userId","provider","providerUserId","accessTokenEnc","refreshTokenEnc",
         "tokenExpiresAt","scopes","connected","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true, now())
       ON CONFLICT ("userId","provider") DO UPDATE SET
         "providerUserId" = EXCLUDED."providerUserId",
         "accessTokenEnc" = EXCLUDED."accessTokenEnc",
         "refreshTokenEnc" = EXCLUDED."refreshTokenEnc",
         "tokenExpiresAt" = EXCLUDED."tokenExpiresAt",
         "scopes" = EXCLUDED."scopes",
         "connected" = true,
         "updatedAt" = now()
       RETURNING *`,
      [
        randomUUID(),
        state.userId,
        dbKey,
        tokens.providerUserId,
        encryptSecret(tokens.accessToken),
        encryptSecret(tokens.refreshToken),
        tokens.expiresAt,
        scope,
      ]
    );

    await query(
      `INSERT INTO "auditLog" ("id","actorId","action","entityType","entityId","metadata")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        randomUUID(),
        state.userId,
        "FITNESS_CONNECTED",
        "ConnectedAccount",
        account.id,
        JSON.stringify({ provider: slug }),
      ]
    );

    const owner = await queryOne(`SELECT "clerkId" FROM "user" WHERE id = $1`, [
      state.userId,
    ]);
    await trackEvent(
      ANALYTICS_EVENT.FITNESS_CONNECTED,
      { provider: slug },
      { distinctId: owner?.clerkId || state.userId }
    );

    // Best-effort initial import so the user immediately sees their activities.
    await syncAccount(account).catch((error) =>
      logger.warn("Initial fitness sync failed", { message: error?.message })
    );

    return redirect(request, { connected: slug });
  } catch (error) {
    logger.error("Fitness connection failed", {
      provider: slug,
      message: error?.message,
    });
    return redirect(request, { error: "connect" });
  }
}
