// Server-side authentication + Clerk → DB user provisioning.
// Never trust client-provided identity; the signed-in user always comes from Clerk.
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { queryOne } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { AuthError, ForbiddenError } from "@/lib/errors";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/** The Clerk user id (our `clerkId`) for the signed-in request, or null. */
export async function getAuthUserId() {
  const { userId } = await auth();
  return userId ?? null;
}

function resolveRole(email) {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return "ADMIN";
  return "USER";
}

/**
 * Find-or-create the DB user for the signed-in Clerk user (JIT provisioning).
 * Idempotent — safe to call from any authenticated path. Returns null when
 * signed out. Phase 6 webhooks will keep this in sync on Clerk changes too.
 */
export async function getCurrentUser() {
  const clerkId = await getAuthUserId();
  if (!clerkId) return null;

  const existing = await queryOne(
    `SELECT * FROM "user" WHERE "clerkId" = $1 AND "deletedAt" IS NULL`,
    [clerkId]
  );
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;
  if (!email)
    throw new AuthError("Your account needs a verified email address.");

  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    null;

  const created = await queryOne(
    `INSERT INTO "user" ("id", "clerkId", "email", "name", "role", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT ("clerkId") DO UPDATE
       SET "email" = EXCLUDED."email",
           "name" = EXCLUDED."name",
           "updatedAt" = now()
     RETURNING *, (xmax = 0) AS "isNew"`,
    [randomUUID(), clerkId, email, name, resolveRole(email)]
  );

  if (!created) return created;
  const { isNew, ...user } = created;
  // Welcome the user the first time we create their row. Best-effort and
  // non-blocking so a slow SMTP handshake never delays the request.
  if (isNew) {
    try {
      after(() => sendWelcomeEmail({ to: user.email, name: user.name }));
    } catch {
      // `after` is unavailable outside a request scope; welcome mail is optional.
    }
  }
  return user;
}

/** Sync the DB user from the latest Clerk profile (called by the SyncUser action). */
export async function syncCurrentUser() {
  return getCurrentUser();
}

export function isAdmin(user) {
  return user?.role === "ADMIN";
}

/** Throws AuthError when signed out; returns the DB user otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

/** Throws when signed out or not an admin; returns the DB admin user. */
export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) throw new ForbiddenError("Admin access required.");
  return user;
}
