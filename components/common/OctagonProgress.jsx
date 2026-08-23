"use client";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Regular octagon inscribed in a 40x40 box, first vertex at top (clockwise).
const POINTS =
  "20,4 31.31,8.69 36,20 31.31,31.31 20,36 8.69,31.31 4,20 8.69,8.69";

/**
 * Octagon progress ring — grey track with a green arc showing goal completion.
 * The exact figure is revealed on hover via tooltip.
 */
export function OctagonProgress({ percent = 0, detail, size = 44, className }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative grid shrink-0 cursor-default place-items-center",
            className
          )}
          style={{ width: size, height: size }}
        >
          <svg viewBox="0 0 40 40" className="size-full">
            <polygon
              points={POINTS}
              fill="none"
              strokeWidth="3.5"
              strokeLinejoin="round"
              className="stroke-white/15"
            />
            <polygon
              points={POINTS}
              fill="none"
              pathLength="100"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - value}
              className="stroke-emerald-400 transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <span className="absolute text-[0.62rem] font-semibold text-emerald-400 tabular-nums">
            {value}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {detail ? `${detail} · ${value}%` : `${value}% complete`}
      </TooltipContent>
    </Tooltip>
  );
}
