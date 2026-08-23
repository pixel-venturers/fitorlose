import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATE_CLASSES = {
  done: "bg-emerald-500/80",
  missed: "bg-red-500/70",
  pending: "bg-muted",
};

const STATE_LABEL = {
  done: "Completed",
  missed: "Missed",
  pending: "Upcoming",
};

/** Compact per-day verification grid for recurring (daily) challenges. */
export function VerificationTimeline({ timeline }) {
  if (!timeline?.length) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {timeline.map((entry) => (
          <Tooltip key={entry.day}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "size-3.5 cursor-default rounded-[3px]",
                  STATE_CLASSES[entry.state] ?? "bg-muted"
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              Day {entry.day} · {STATE_LABEL[entry.state] ?? entry.state}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-emerald-500/80" />{" "}
          Completed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-red-500/70" /> Missed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-muted size-2.5 rounded-[3px]" /> Upcoming
        </span>
      </div>
    </div>
  );
}
