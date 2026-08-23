"use server";

import { syncCurrentUser } from "@/lib/auth";
import { actionOk, toActionError } from "@/lib/errors";

/** Provision/refresh the DB user from Clerk. Called once after sign-in. */
export async function SyncUser() {
  try {
    const user = await syncCurrentUser();
    return actionOk(user ? { id: user.id, role: user.role } : null);
  } catch (error) {
    return toActionError(error);
  }
}
