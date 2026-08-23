import { cn } from "@/lib/utils";

/** Section heading for internal page sections. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className
      )}
    >
      {eyebrow ? (
        <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-widest uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-3 text-sm text-pretty sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
