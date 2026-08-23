"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SetChallengeOutcome } from "@/actions/Admin";
import { PartyPopper, XCircle } from "lucide-react";
import { toast } from "sonner";

import { CHALLENGE_STATUS } from "@/lib/constants";

import { Button } from "@/components/ui/button";

// Mirrors OUTCOME_ALLOWED_FROM in actions/Admin.js — only these can be finalized.
const OUTCOME_ALLOWED_FROM = [
  CHALLENGE_STATUS.ACTIVE,
  CHALLENGE_STATUS.AWAITING_VERIFICATION,
  CHALLENGE_STATUS.UNDER_REVIEW,
  CHALLENGE_STATUS.AWAITING_REVIEW,
  CHALLENGE_STATUS.VERIFIED,
  CHALLENGE_STATUS.DISPUTED,
];

/** Mark a challenge WON or LOST (SetChallengeOutcome). WON queues a settlement. */
export function OutcomeActions({ challengeId, status, label = "challenge" }) {
  const router = useRouter();
  const [done, setDone] = useState(null);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <span
        className={
          done === CHALLENGE_STATUS.WON
            ? "text-xs font-medium text-emerald-400"
            : "text-xs font-medium text-red-400"
        }
      >
        {done === CHALLENGE_STATUS.WON ? "Won" : "Lost"}
      </span>
    );
  }

  if (!OUTCOME_ALLOWED_FROM.includes(status)) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  function decide(outcome) {
    startTransition(async () => {
      const result = await SetChallengeOutcome({ challengeId, outcome });
      if (result.ok) {
        setDone(outcome);
        toast.success(
          outcome === CHALLENGE_STATUS.WON
            ? `Marked ${label} won — settlement queued.`
            : `Marked ${label} lost.`
        );
        router.refresh();
      } else {
        toast.error(result.error?.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="xs"
        variant="outline"
        disabled={isPending}
        onClick={() => decide(CHALLENGE_STATUS.WON)}
      >
        <PartyPopper />
        Won
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={isPending}
        onClick={() => decide(CHALLENGE_STATUS.LOST)}
      >
        <XCircle />
        Lost
      </Button>
    </div>
  );
}
