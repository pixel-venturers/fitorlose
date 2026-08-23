// Server-side analytics abstraction. Business code calls trackEvent(), never the
// PostHog SDK directly (PLAN rule). Analytics is a secondary system — capture is
// best-effort and NEVER throws, so it can't break a payment/challenge operation.
import "server-only";

import { logger } from "@/lib/logger";
import { getPostHogClient } from "@/lib/posthog-server";

export const ANALYTICS_EVENT = {
  CHALLENGE_CREATED: "challenge_created",
  PROOF_SUBMITTED: "proof_submitted",
  PAYMENT_STARTED: "payment_started",
  PAYMENT_WEBHOOK_RECEIVED: "payment_webhook_received",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_CANCELLED: "payment_cancelled",
  CHALLENGE_VERIFIED: "challenge_verified",
  CHALLENGE_WON: "challenge_won",
  CHALLENGE_LOST: "challenge_lost",
  CHALLENGE_DISPUTED: "challenge_disputed",
  REWARD_SETTLED: "reward_settled",
  FITNESS_CONNECTED: "fitness_connected",
  FITNESS_DISCONNECTED: "fitness_disconnected",
  ACTIVITIES_SYNCED: "activities_synced",
};

/**
 * Capture a confirmed server-side business event. `distinctId` should be the
 * Clerk user id (matches the client-side identify) so client + server events
 * merge onto one person; falls back to "server" for system events.
 */
export async function trackEvent(event, properties = {}, { distinctId } = {}) {
  try {
    const client = getPostHogClient();
    if (!client) return;
    client.capture({
      distinctId: distinctId || "server",
      event,
      properties: { source: "server", ...properties },
    });
    // Serverless functions may freeze after responding — flush now.
    await client.flush();
  } catch (error) {
    logger.warn("Analytics capture failed", { event, message: error?.message });
  }
}
