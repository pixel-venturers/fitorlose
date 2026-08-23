"use client";

import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CopyField } from "@/components/admin/CopyField";

/** Clickable member name → popover with copyable full name, email and UUID. */
export function UserPopover({ user, className }) {
  if (!user) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "font-medium underline-offset-2 hover:underline",
            className
          )}
        >
          {user.name}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2.5">
        <div>
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-muted-foreground text-xs">Member details</p>
        </div>
        <CopyField label="Full name" value={user.name} />
        <CopyField label="Email" value={user.email} />
        <CopyField label="User UUID" value={user.id} mono />
      </PopoverContent>
    </Popover>
  );
}
