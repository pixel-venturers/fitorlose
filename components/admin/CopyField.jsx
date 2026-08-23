"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

/** Labeled value with click-to-copy, used inside admin detail popovers. */
export function CopyField({ label, value, mono = false }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[0.7rem] font-medium tracking-wide uppercase">
        {label}
      </p>
      <button
        type="button"
        onClick={copy}
        className="group border-border bg-muted/40 hover:bg-muted flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors"
      >
        <span className={cn("truncate", mono && "font-mono text-xs")}>
          {value}
        </span>
        {copied ? (
          <Check className="size-3.5 shrink-0 text-emerald-400" />
        ) : (
          <Copy className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0" />
        )}
      </button>
    </div>
  );
}
