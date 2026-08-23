"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

/**
 * Identifies the current Clerk user in PostHog when they are signed in.
 * Resets the PostHog identity when the user signs out.
 * Rendered inside ClerkProvider in the root layout.
 */
export default function PostHogUserIdentifier() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      });
    } else {
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
