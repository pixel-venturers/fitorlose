"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const TYPE_DOT = {
  created: "bg-sky-400",
  won: "bg-emerald-400",
  verified: "bg-indigo-400",
};

/** Rotating "recent activity" pill (real data from getRecentActivity). */
export function LiveActivityTicker({ items, className }) {
  const [index, setIndex] = useState(0);
  const count = items?.length ?? 0;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, 3500);
    return () => clearInterval(id);
  }, [count]);

  if (!count) return null;
  const item = items[index % count];

  return (
    <div
      className={cn(
        "border-border/70 bg-card/60 inline-flex max-w-full items-center gap-2.5 rounded-full border px-4 py-2 text-sm backdrop-blur",
        className
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          TYPE_DOT[item.type] ?? "bg-sky-400"
        )}
        aria-hidden
      />
      <span
        key={index}
        className="animate-in fade-in text-muted-foreground truncate duration-500"
      >
        {item.text}
      </span>
      <span className="text-muted-foreground/70 hidden shrink-0 text-xs sm:inline">
        · {item.agoLabel}
      </span>
    </div>
  );
}
