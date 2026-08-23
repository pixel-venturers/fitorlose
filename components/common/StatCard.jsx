import { cn } from "@/lib/utils";

/** Compact stat display used on dashboards, profiles and stats pages. */
export function StatCard({
  label,
  value,
  hint,
  icon: IconComponent,
  className,
  valueClassName,
}) {
  return (
    <div
      className={cn(
        "bg-card ring-foreground/10 rounded-xl p-4 ring-1 sm:p-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        {IconComponent ? (
          <IconComponent className="text-muted-foreground size-4" />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
          valueClassName
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
