"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReviewSubmission } from "@/actions/Admin";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Approve / reject controls wired to the ReviewSubmission action. */
export function ReviewActions({ submissionId, label = "submission" }) {
  const router = useRouter();
  const [done, setDone] = useState(null);
  const [isPending, startTransition] = useTransition();

  function review(decision) {
    startTransition(async () => {
      const result = await ReviewSubmission({ submissionId, decision });
      if (result.ok) {
        setDone(decision === "approve" ? "approved" : "rejected");
        toast.success(
          decision === "approve" ? `Approved ${label}.` : `Rejected ${label}.`
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
          done === "approved"
            ? "text-xs font-medium text-emerald-400"
            : "text-xs font-medium text-red-400"
        }
      >
        {done === "approved" ? "Approved" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="xs"
        variant="outline"
        disabled={isPending}
        onClick={() => review("approve")}
      >
        <Check />
        Approve
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={isPending}
        onClick={() => review("reject")}
      >
        <X />
        Reject
      </Button>
    </div>
  );
}
