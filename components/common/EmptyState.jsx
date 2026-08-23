import { cn } from "@/lib/utils";

/** Intentional empty state with optional icon, description and action. */
export function EmptyState({ icon: IconComponent, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/30 px-6 py-16 text-center",
        className
      )}
    >
      {IconComponent ? (
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <IconComponent className="size-6" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
