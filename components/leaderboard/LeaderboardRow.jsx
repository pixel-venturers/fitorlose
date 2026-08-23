"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategory } from "@/data/challenge-categories";
import { Trophy } from "lucide-react";

import {
  CHALLENGE_STATUS,
  LEADERBOARD_PAGE_SIZE,
  VISIBILITY,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { buildChallengeShareMessage } from "@/lib/share";
import { cn } from "@/lib/utils";

import { Icon } from "@/components/common/Icon";
import { OctagonProgress } from "@/components/common/OctagonProgress";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ShareButton } from "@/components/share/ShareButton";

function RankBadge({ rank }) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold tabular-nums",
        rank === 1 && "bg-linear-to-br from-sky-400 to-indigo-600 text-white",
        rank === 2 &&
          "bg-linear-to-br from-slate-300 to-slate-500 text-slate-900",
        rank === 3 && "bg-linear-to-br from-amber-400 to-orange-600 text-white",
        rank > 3 && "bg-muted text-muted-foreground"
      )}
    >
      {rank}
    </div>
  );
}

export function LeaderboardRow({ challenge }) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const isChallengeWonPage = pathname === "/challenges-won";
  const category = getCategory(challenge.categorySlug);
  const page = Math.ceil(challenge.rank / LEADERBOARD_PAGE_SIZE);
  const anonymous = challenge.visibility === VISIBILITY.ANONYMOUS;
  const isActive = challenge.status === CHALLENGE_STATUS.ACTIVE;
  const shareBase =
    challenge.status === CHALLENGE_STATUS.WON ? "/challenges-won" : "/";
  const shareUrl = `${shareBase}?page=${page}#rank-${challenge.rank}`;
  const shareMessage = buildChallengeShareMessage({
    own: challenge.isOwn,
    amount: challenge.amount,
    currency: challenge.currency,
    name: challenge.displayName,
    goal: challenge.title,
    durationDays: challenge.durationDays,
  });

  // Claim = the smallest commitment that would out-rank this active spot.
  const canClaim = isActive && !isChallengeWonPage && !challenge.isOwn;
  const claimAmount = Math.floor(Number(challenge.amount) || 0) + 1;
  const claimHref = `/create?amount=${claimAmount}&currency=${challenge.currency}`;

  return (
    <div
      id={`rank-${challenge.rank}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="bg-card ring-foreground/10 hover:ring-foreground/20 relative flex scroll-mt-24 items-center gap-3 rounded-xl p-3 ring-1 transition-all sm:gap-4 sm:p-4"
    >
      {canClaim ? (
        <Link
          href={claimHref}
          className={cn(
            "bg-primary text-primary-foreground absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-lg ring-1 ring-black/10 transition-all duration-150 hover:brightness-110",
            hovered
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          )}
        >
          <Trophy className="size-3" />
          Claim this rank for {formatCurrency(claimAmount, challenge.currency)}
        </Link>
      ) : null}
      <RankBadge rank={challenge.rank} />
      <UserAvatar
        src={challenge.avatarUrl}
        initials={challenge.ownerInitials}
        gradient={challenge.avatarGradient}
        anonymous={anonymous}
      />

      <div className="min-w-0 flex-1">
        <Link
          href={`/challenges/${challenge.id}`}
          className="block truncate font-semibold hover:underline"
        >
          {challenge.displayName}
        </Link>
        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <Icon name={category?.icon} className="size-3.5" />
            {challenge.categoryLabel}
          </span>
          <span aria-hidden>·</span>
          <span className="truncate">{challenge.title}</span>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-bold tracking-tight text-emerald-400 tabular-nums sm:text-xl">
          {formatCurrency(challenge.amount, challenge.currency)}
        </div>
        {isActive ? (
          <div className="text-muted-foreground text-xs">
            {challenge.daysLeft} days left
          </div>
        ) : null}
      </div>

      {!isChallengeWonPage && (
        <OctagonProgress
          percent={challenge.progressPercent}
          detail={challenge.progressLabel}
          size={44}
          className="hidden sm:grid"
        />
      )}

      <ShareButton
        url={shareUrl}
        title={challenge.title}
        message={shareMessage}
        iconOnly
      />
    </div>
  );
}
