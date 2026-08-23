"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function SortHeader({ label, active, dir, onClick, className }) {
  const IconComponent = !active
    ? ArrowUpDown
    : dir === "asc"
      ? ArrowUp
      : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {label}
      <IconComponent className="size-3.5" />
    </button>
  );
}
