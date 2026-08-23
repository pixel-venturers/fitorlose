"use client";

import { PAYMENT_STATUS_META } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CopyField } from "@/components/admin/CopyField";

/** Clickable transaction id → popover with provider, amount, id and status. */
export function TransactionPopover({ transaction, className }) {
  const status = PAYMENT_STATUS_META[transaction.status] ?? {
    label: transaction.status,
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-muted-foreground font-mono text-xs underline-offset-2 hover:underline",
            className
          )}
        >
          {transaction.id}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2.5">
        <CopyField label="Transaction ID" value={transaction.id} mono />
        <CopyField label="Provider" value={transaction.provider} />
        <CopyField
          label="Amount"
          value={formatCurrency(transaction.amount, transaction.currency)}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">{status.label}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
