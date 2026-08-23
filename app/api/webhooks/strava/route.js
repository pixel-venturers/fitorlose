// Strava webhook. GET performs the subscription verification handshake; POST
// receives activity events and triggers an idempotent sync for the matching
// connected account. Strava events are unsigned — we only ever act on owner ids
// we already have a connected account for, and the sync dedups by activity id.
import { syncAccount } from "@/fitness/sync";

import { DB_PROVIDER_BY_SLUG } from "@/lib/constants";
import { queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRAVA_DB_KEY = DB_PROVIDER_BY_SLUG.strava;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return Response.json({ "hub.challenge": challenge }, { status: 200 });
  }
  return Response.json({ error: "verification failed" }, { status: 403 });
}

export async function POST(request) {
  let event;
  try {
    event = await request.json();
  } catch {
    return Response.json({ received: true }, { status: 200 });
  }

  try {
    const isActivity = event?.object_type === "activity";
    const isRelevant =
      event?.aspect_type === "create" || event?.aspect_type === "update";
    const ownerId = event?.owner_id != null ? String(event.owner_id) : null;

    if (isActivity && isRelevant && ownerId) {
      const account = await queryOne(
        `SELECT * FROM "connectedAccount"
          WHERE provider = $1 AND "providerUserId" = $2 AND connected = true`,
        [STRAVA_DB_KEY, ownerId]
      );
      if (account) await syncAccount(account);
    }
  } catch (error) {
    // Never fail the webhook — Strava disables endpoints that keep erroring.
    logger.warn("Strava webhook processing failed", {
      message: error?.message,
    });
  }

  // Always 200 so Strava doesn't retry-storm or drop the subscription.
  return Response.json({ received: true }, { status: 200 });
}
