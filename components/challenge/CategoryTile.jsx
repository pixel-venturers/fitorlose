import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { GlowCard } from "@/components/common/GlowCard";
import { Icon } from "@/components/common/Icon";

/** Category tile (with glow) linking to the SEO category page. */
export function CategoryTile({ category, glow = true }) {
  return (
    <GlowCard
      glow={glow}
      innerClassName={cn("bg-linear-to-br", category.gradient)}
    >
      <Link
        href={`/fitness-challenges/${category.slug}`}
        className={cn(
          "group/tile relative flex h-full flex-col p-5",
          !glow && "overflow-hidden"
        )}
      >
        {category.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={category.coverImage}
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover/tile:scale-110"
            />
            <div className="from-background/90 via-background/60 to-background/30 absolute inset-0 bg-gradient-to-t" />
          </>
        ) : null}
        <div className="bg-background/40 text-foreground relative grid size-10 place-items-center rounded-lg backdrop-blur">
          <Icon name={category.icon} className="size-5" />
        </div>
        <h3 className="relative mt-4 font-medium">{category.label}</h3>
        <p className="text-muted-foreground relative mt-1 text-sm">
          {category.tagline}
        </p>
        <ArrowRight className="text-foreground absolute top-5 right-5 z-10 size-4 -translate-x-1 opacity-0 transition-all group-hover/tile:translate-x-0 group-hover/tile:opacity-100" />
      </Link>
    </GlowCard>
  );
}
