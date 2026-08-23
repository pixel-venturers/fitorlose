"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Card wrapper with a mouse-following glow (border + soft inner sheen).
 * Pass the card frame via `className` is not needed — supply inner styling via
 * `innerClassName` (e.g. a gradient); content goes as children.
 */
export function GlowCard({
  className,
  innerClassName,
  children,
  glow = true,
  ...props
}) {
  const ref = useRef(null);

  function handleMove(event) {
    if (!glow) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--gx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--gy", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn(
        "group/glow bg-foreground/[0.08] relative overflow-hidden rounded-xl p-px",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/glow:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--gx) var(--gy), rgba(129,140,248,0.85), transparent 40%)",
        }}
      />
      <div
        className={cn("bg-card relative h-full rounded-[11px]", innerClassName)}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/glow:opacity-100"
          style={{
            background:
              "radial-gradient(240px circle at var(--gx) var(--gy), rgba(129,140,248,0.10), transparent 45%)",
          }}
        />
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  );
}
