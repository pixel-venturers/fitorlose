import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

// Semantic tone -> color classes. Single source for status-style badges.
export const TONE_CLASSES = {
  active: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  scheduled: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  muted: "border-border bg-muted text-muted-foreground",
};

/** Outline badge coloured by semantic tone. Always shows a text label. */
export function ToneBadge({
  label,
  tone = "muted",
  className,
  showDot = true,
}) {
  return (
    <Badge
      variant="outline"
      className={cn(TONE_CLASSES[tone] ?? TONE_CLASSES.muted, className)}
    >
      {showDot ? (
        <span
          className="size-1.5 rounded-full bg-current opacity-80"
          aria-hidden
        />
      ) : null}
      {label}
    </Badge>
  );
}
