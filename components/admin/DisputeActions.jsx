"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ResolveDispute } from "@/actions/Admin";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Resolve (re-review) / reject controls wired to the ResolveDispute action. */
export function DisputeActions({ disputeId, label = "dispute" }) {
  const router = useRouter();
  const [done, setDone] = useState(null);
  const [isPending, startTransition] = useTransition();

  function resolve(decision) {
    startTransition(async () => {
      const result = await ResolveDispute({ disputeId, decision });
      if (result.ok) {
        setDone(decision === "reject" ? "rejected" : "resolved");
        toast.success(
          decision === "reject"
            ? `Rejected ${label}.`
            : `Sent ${label} back for re-review.`
        );
        router.refresh();
      } else {
        toast.error(result.error?.message ?? "Something went wrong.");
      }
    });
  }

  if (done) {
    return (
      <span
        className={
          done === "resolved"
            ? "text-xs font-medium text-emerald-400"
            : "text-xs font-medium text-red-400"
        }
      >
        {done === "resolved" ? "Re-review" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="xs"
        variant="outline"
        disabled={isPending}
        onClick={() => resolve("resolve")}
      >
        <Check />
        Re-review
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={isPending}
        onClick={() => resolve("reject")}
      >
        <X />
        Reject
      </Button>
    </div>
  );
}
