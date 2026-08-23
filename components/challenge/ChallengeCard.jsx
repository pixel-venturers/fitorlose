import Link from "next/link";

import { CHALLENGE_STATUS, VISIBILITY, VISIBILITY_META } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { ChallengeStatusBadge } from "@/components/challenge/ChallengeStatusBadge";
import { Icon } from "@/components/common/Icon";
import { OctagonProgress } from "@/components/common/OctagonProgress";
import { UserAvatar } from "@/components/common/UserAvatar";

const TERMINAL = [CHALLENGE_STATUS.WON, CHALLENGE_STATUS.LOST];

export function ChallengeCard({ challenge, owner = false }) {
  const inProgress = !TERMINAL.includes(challenge.status);
  const anonymous = challenge.visibility === VISIBILITY.ANONYMOUS;
  const visibilityMeta = VISIBILITY_META[challenge.visibility];

  return (
    <Link
      href={`/challenges/${challenge.id}${owner ? "?from=dashboard" : ""}`}
      className="group bg-card ring-foreground/10 hover:ring-foreground/25 flex flex-col overflow-hidden rounded-xl ring-1 transition-all"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {challenge.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={challenge.coverImage}
              alt=""
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </>
        ) : (
          <div
            className={cn("size-full bg-linear-to-br", challenge.gradient)}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="border-border mb-2 flex w-full justify-between border-b pb-2">
          {owner ? (
            <>
              <span className="bg-background/60 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur">
                <Icon name={visibilityMeta.icon} className="size-3.5" />
                {visibilityMeta.label}
              </span>
              <div className="">
                <ChallengeStatusBadge status={challenge.status} />
              </div>
            </>
          ) : (
            <span className="bg-background/60 inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 backdrop-blur">
              <UserAvatar
                src={challenge.avatarUrl}
                initials={challenge.ownerInitials}
                gradient={challenge.avatarGradient}
                anonymous={anonymous}
                className="size-6 text-[0.6rem]"
              />
              <span className="text-base font-bold">
                {challenge.displayName}
              </span>
            </span>
          )}
        </div>
        <h3 className="font-medium">{challenge.title}</h3>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <div className="text-lg font-bold tracking-tight text-emerald-400 tabular-nums">
              {formatCurrency(challenge.amount, challenge.currency)}
            </div>
            {challenge.upcoming ? (
              <div className="text-muted-foreground mt-0.5 text-xs">
                {challenge.startsInDays != null
                  ? `Starts in ${challenge.startsInDays} day${challenge.startsInDays === 1 ? "" : "s"}`
                  : "Upcoming"}
              </div>
            ) : inProgress ? (
              <div className="text-muted-foreground mt-0.5 text-xs">
                {challenge.daysLeft} days left
              </div>
            ) : null}
          </div>
          <OctagonProgress
            percent={challenge.progressPercent}
            detail={challenge.progressLabel}
            size={44}
          />
        </div>
      </div>
    </Link>
  );
}
