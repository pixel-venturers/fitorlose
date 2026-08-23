"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CopyField } from "@/components/admin/CopyField";

/** Clickable challenge title → popover with copyable title + UUID and an open link. */
export function ChallengePopover({ challenge, className }) {
  if (!challenge) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-left font-medium underline-offset-2 hover:underline",
            className
          )}
        >
          {challenge.title}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2.5">
        <CopyField label="Title" value={challenge.title} />
        <CopyField
          label="Challenge UUID"
          value={challenge.uuid ?? challenge.id}
          mono
        />
        <Link
          href={`/challenges/${challenge.id}?from=admin`}
          className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Open challenge
          <ExternalLink className="size-3.5" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
