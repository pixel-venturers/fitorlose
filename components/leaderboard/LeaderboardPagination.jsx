import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";

function pageHref(basePath, page) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

function buildPages(current, total) {
  const pages = [1];
  const neighbors = 1;
  if (current - neighbors > 2) pages.push("left-dots");
  for (let p = Math.max(2, current - neighbors); p <= Math.min(total - 1, current + neighbors); p += 1) {
    pages.push(p);
  }
  if (current + neighbors < total - 1) pages.push("right-dots");
  if (total > 1) pages.push(total);
  return pages;
}

/** Server-side pagination — every page is a real, shareable URL (?page=N). */
export function LeaderboardPagination({ currentPage, totalPages, basePath = "/" }) {
  if (totalPages <= 1) return null;

  const pages = buildPages(currentPage, totalPages);
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Leaderboard pagination">
      {prevDisabled ? (
        <span
          className={cn(buttonVariants({ variant: "outline", size: "icon" }), "pointer-events-none opacity-40")}
          aria-disabled
        >
          <ChevronLeft />
        </span>
      ) : (
        <Link
          href={pageHref(basePath, currentPage - 1)}
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Link>
      )}

      {pages.map((page) =>
        typeof page === "string" ? (
          <span key={page} className="px-1.5 text-sm text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={page}
            href={pageHref(basePath, page)}
            className={cn(
              buttonVariants({ variant: page === currentPage ? "default" : "outline", size: "icon" }),
              "tabular-nums"
            )}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        )
      )}

      {nextDisabled ? (
        <span
          className={cn(buttonVariants({ variant: "outline", size: "icon" }), "pointer-events-none opacity-40")}
          aria-disabled
        >
          <ChevronRight />
        </span>
      ) : (
        <Link
          href={pageHref(basePath, currentPage + 1)}
          className={buttonVariants({ variant: "outline", size: "icon" })}
          aria-label="Next page"
        >
          <ChevronRight />
        </Link>
      )}
    </nav>
  );
}
