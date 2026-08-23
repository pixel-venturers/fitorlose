"use client";

import { useEffect } from "react";
import { SyncUser } from "@/actions/User";
import { useAuth } from "@clerk/nextjs";

/**
 * Provisions/refreshes the DB user from Clerk after sign-in. Idempotent —
 * safe to run on every load. Rendered inside ClerkProvider in the root layout.
 */
export default function UserSync() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      SyncUser().catch(() => {});
    }
  }, [isLoaded, isSignedIn]);

  return null;
}
