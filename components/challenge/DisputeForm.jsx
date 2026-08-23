"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OpenDispute } from "@/actions/Dispute";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Lets a challenge owner dispute a lost/under-review result for admin re-review. */
export function DisputeForm({ challengeId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const res = await OpenDispute({ challengeId, reason });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Dispute submitted — an admin will re-review it.");
      setReason("");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error?.message ?? "Couldn't open the dispute.");
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Dispute this result
      </Button>
    );
  }

  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-4 ring-1">
      <p className="text-sm font-medium">Explain your dispute</p>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Tell us why this result looks wrong. An admin will re-review your proof.
      </p>
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        className="mt-3"
        placeholder="What happened?"
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit dispute"}
        </Button>
      </div>
    </div>
  );
}
