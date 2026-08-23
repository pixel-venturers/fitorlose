import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** Live statistics bar. Values come from PostgreSQL + PostHog (getLiveStats). */
export function LiveStatsBar({ stats, className }) {
  const online = stats?.online;

  const items = [
    {
      key: "online",
      node: (
        <>
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <strong className="text-foreground font-semibold tabular-nums">
            {online != null ? formatNumber(online) : "\u2014"}
          </strong>
          online
        </>
      ),
    },
    {
      key: "committed",
      node: (
        <>
          <strong className="text-foreground font-semibold tabular-nums">
            {formatCurrency(stats?.totalCommitted ?? 0, stats?.currency)}
          </strong>
          committed
        </>
      ),
    },
    {
      key: "challenges",
      node: (
        <>
          <strong className="text-foreground font-semibold tabular-nums">
            {formatNumber(stats?.totalChallenges ?? 0)}
          </strong>
          challenges
        </>
      ),
    },
  ];

  return (
    <div
      className={cn(
        "border-border/60 bg-card/50 mx-auto flex w-fit [scrollbar-width:none] flex-wrap items-center justify-center-safe gap-3 overflow-x-auto rounded-full border px-4 py-2.5 backdrop-blur [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {items.map((item, index) => (
        <span
          key={item.key}
          className="text-muted-foreground inline-flex items-center gap-1.5 text-sm whitespace-nowrap"
        >
          {index > 0 ? (
            <span className="text-border mr-3" aria-hidden>
              ·
            </span>
          ) : null}
          {item.node}
        </span>
      ))}
      <Link
        href="/stats"
        className="text-primary inline-flex shrink-0 items-center gap-1 pl-3 text-sm font-medium whitespace-nowrap hover:underline"
      >
        See more stats
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
