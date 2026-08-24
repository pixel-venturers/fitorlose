import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", showWordmark = true }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="FitOrLose home"
    >
      <Image
        src="/logo.png"
        alt=""
        width={24}
        height={24}
        priority
        className="size-6"
      />
      {showWordmark ? (
        <span className="text-lg font-semibold tracking-tight">
          Fit<span className="text-primary">Or</span>Lose
        </span>
      ) : null}
    </Link>
  );
}
