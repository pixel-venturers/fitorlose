import Link from "next/link";
import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", showWordmark = true }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="FitOrLose home"
    >
      <span className="shadow-primary/25 grid size-8 place-items-center rounded-lg bg-linear-to-br from-sky-500 to-indigo-600 text-white shadow-lg transition-transform group-hover:scale-105">
        <Flame className="size-4" />
      </span>
      {showWordmark ? (
        <span className="text-lg font-semibold tracking-tight">
          Fit<span className="text-primary">Or</span>Lose
        </span>
      ) : null}
    </Link>
  );
}
