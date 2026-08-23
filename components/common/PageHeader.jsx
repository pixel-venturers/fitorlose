import { cn } from "@/lib/utils";

/** Marketing/content page header with optional eyebrow, title and description. */
export function PageHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  children,
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
        <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-bold tracking-widest uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="text-muted-foreground mt-4 text-base text-pretty sm:text-lg">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className={cn("mt-8", centered && "flex justify-center")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
