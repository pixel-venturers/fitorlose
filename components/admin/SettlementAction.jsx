"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProcessSettlement } from "@/actions/Admin";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/formatters";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Process a reward with an explicit confirm step, wired to ProcessSettlement.
 * The action is idempotent server-side — a reward can never be sent twice.
 */
export function SettlementAction({ settlementId, amount, currency, user }) {
  const router = useRouter();
  const [processed, setProcessed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await ProcessSettlement({ settlementId });
      if (result.ok) {
        setProcessed(true);
        toast.success(
          `Reward of ${formatCurrency(amount, currency)} sent to ${user}.`
        );
        router.refresh();
      } else {
        toast.error(result.error?.message ?? "Couldn't process the reward.");
      }
    });
  }

  if (processed) {
    return (
      <span className="text-xs font-medium text-emerald-400">Reward sent</span>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="xs">
          <HandCoins />
          Process reward
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process reward</DialogTitle>
          <DialogDescription>
            Return {formatCurrency(amount, currency)} to {user}. This creates a
            new reward transaction and cannot be sent twice.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={confirm} disabled={isPending}>
            {isPending ? "Processing…" : "Confirm reward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
