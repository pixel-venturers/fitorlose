import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/data/challenge-categories";
import {
  CalendarClock,
  ChevronLeft,
  PartyPopper,
  Scale,
  Wallet,
  XCircle,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import {
  CHALLENGE_STATUS,
  LEADERBOARD_PAGE_SIZE,
  VERIFICATION_TYPE_META,
  VISIBILITY,
  VISIBILITY_META,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getChallengeById } from "@/lib/queries/challenges";
import { buildChallengeShareMessage } from "@/lib/share";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChallengeProgress } from "@/components/challenge/ChallengeProgress";
import { ChallengeStatusBadge } from "@/components/challenge/ChallengeStatusBadge";
import { DisputeForm } from "@/components/challenge/DisputeForm";
import { PaymentButton } from "@/components/challenge/PaymentButton";
import { ProofList } from "@/components/challenge/ProofList";
import { ProofUpload } from "@/components/challenge/ProofUpload";
import { VerificationTimeline } from "@/components/challenge/VerificationTimeline";
import { Container } from "@/components/common/Container";
import { Icon } from "@/components/common/Icon";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ShareButton } from "@/components/share/ShareButton";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const challenge = await getChallengeById(id);
  if (!challenge) return { title: "Challenge not found" };
  return {
    title: challenge.title,
    description: `${challenge.displayName} committed ${formatCurrency(challenge.amount, challenge.currency)} on "${challenge.title}".`,
  };
}

function shareUrlFor(challenge) {
  if (challenge.rank) {
    const page = Math.ceil(challenge.rank / LEADERBOARD_PAGE_SIZE);
    const base =
      challenge.status === CHALLENGE_STATUS.WON ? "/challenges-won" : "/";
    return `${base}?page=${page}#rank-${challenge.rank}`;
  }
  return `/challenges/${challenge.id}`;
}

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const viewer = await getCurrentUser();
  const challenge = await getChallengeById(id, viewer);
  if (!challenge) notFound();

  const category = getCategory(challenge.categorySlug);
  const anonymous = challenge.visibility === VISIBILITY.ANONYMOUS;
  const visibilityMeta = VISIBILITY_META[challenge.visibility];
  const verificationMeta = VERIFICATION_TYPE_META[challenge.verificationType];
  const isActive = challenge.status === CHALLENGE_STATUS.ACTIVE;
  const isAwaiting =
    challenge.status === CHALLENGE_STATUS.AWAITING_VERIFICATION;
  const isWon = challenge.status === CHALLENGE_STATUS.WON;
  const isLost = challenge.status === CHALLENGE_STATUS.LOST;
  const isDisputed = challenge.status === CHALLENGE_STATUS.DISPUTED;
  const isUnderReview =
    challenge.status === CHALLENGE_STATUS.UNDER_REVIEW ||
    challenge.status === CHALLENGE_STATUS.AWAITING_REVIEW;
  const isUpcoming = challenge.upcoming;
  const isPaymentPending =
    challenge.status === CHALLENGE_STATUS.PAYMENT_PENDING;
  const paymentProcessing = query?.payment === "processing";
  const own = Boolean(viewer) && challenge.userId === viewer.id;
  const from = query?.from;
  const back =
    from === "dashboard"
      ? { href: "/dashboard", label: "Back to dashboard" }
      : from === "admin"
        ? { href: "/admin/challenges", label: "Back to challenges" }
        : { href: "/", label: "Back to leaderboard" };
  const canSubmitProof = own && (isActive || isAwaiting);
  const canDispute = own && (isLost || isUnderReview);
  const description =
    challenge.description ??
    `A ${challenge.categoryLabel} challenge with ${formatCurrency(challenge.amount, challenge.currency)} on the line.`;
  const shareMessage = buildChallengeShareMessage({
    own,
    amount: challenge.amount,
    currency: challenge.currency,
    name: challenge.displayName,
    goal: challenge.title,
    durationDays: challenge.durationDays,
  });

  return (
    <Container className="py-10 sm:py-12">
      <Link
        href={back.href}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft className="size-4" />
        {back.label}
      </Link>

      <div className="group ring-foreground/10 relative mt-4 overflow-hidden rounded-2xl ring-1">
        {challenge.coverImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={challenge.coverImage}
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="bg-background/70 absolute inset-0" />
            <div className="from-background via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />
          </>
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-linear-to-br",
              challenge.gradient
            )}
          />
        )}
        <div className="relative p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="bg-background/40 gap-1.5 backdrop-blur"
            >
              <Icon name={category?.icon} className="size-3.5" />
              {challenge.categoryLabel}
            </Badge>
            <ChallengeStatusBadge status={challenge.status} />
            <Badge
              variant="outline"
              className="bg-background/40 gap-1.5 backdrop-blur"
            >
              <Icon name={visibilityMeta.icon} className="size-3.5" />
              {visibilityMeta.label}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {challenge.title}
          </h1>
          <div className="mt-5 flex items-center gap-3">
            <UserAvatar
              src={challenge.avatarUrl}
              initials={challenge.ownerInitials}
              gradient={challenge.avatarGradient}
              anonymous={anonymous}
              size="sm"
            />
            <span className="text-sm font-medium">{challenge.displayName}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <p className="text-muted-foreground text-pretty">{description}</p>

          {own && isPaymentPending ? (
            <Card className="ring-amber-500/25">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                    <Wallet className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {paymentProcessing
                        ? "Confirming your payment…"
                        : "Payment pending"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {paymentProcessing
                        ? "Waiting for confirmation from the payment provider — this updates automatically once it's done."
                        : `Commit ${formatCurrency(challenge.amount, challenge.currency)} to activate this challenge.`}
                    </p>
                  </div>
                </div>
                {!paymentProcessing ? (
                  <PaymentButton
                    challengeId={challenge.id}
                    className="shrink-0"
                  />
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {isUpcoming ? (
            <Card className="ring-sky-500/25">
              <CardContent className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-500/15 text-sky-400">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="font-medium">
                    Starts {formatDate(challenge.startDate)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    This challenge is scheduled and hasn&apos;t started yet
                    {challenge.startsInDays != null
                      ? ` — begins in ${challenge.startsInDays} day${challenge.startsInDays === 1 ? "" : "s"}`
                      : ""}
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ChallengeProgress
                percent={challenge.progressPercent}
                label={challenge.progressLabel}
                daysLeft={isActive ? challenge.daysLeft : undefined}
              />
            </CardContent>
          </Card>

          {challenge.timeline ? (
            <Card>
              <CardHeader>
                <CardTitle>Daily verification</CardTitle>
              </CardHeader>
              <CardContent>
                <VerificationTimeline timeline={challenge.timeline} />
              </CardContent>
            </Card>
          ) : null}

          {canSubmitProof ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Submit proof
              </h2>
              <ProofUpload
                challengeId={challenge.id}
                challengeTitle={challenge.title}
              />
            </section>
          ) : null}

          {challenge.proofs && challenge.proofs.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Proof submissions
              </h2>
              <ProofList proofs={challenge.proofs} />
            </section>
          ) : null}

          {isWon ? (
            <Card className="ring-emerald-500/25">
              <CardContent className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <PartyPopper className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Challenge won</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    The commitment of{" "}
                    {formatCurrency(challenge.amount, challenge.currency)} was
                    returned as a reward.
                    {challenge.refundTxnId
                      ? ` Transaction ${challenge.refundTxnId}.`
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isLost ? (
            <Card className="ring-red-500/25">
              <CardContent className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-500/15 text-red-400">
                  <XCircle className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Challenge lost</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    The goal wasn't met within the challenge window, so the
                    commitment was forfeited.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isUnderReview ? (
            <Card className="ring-amber-500/25">
              <CardContent className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                  <Scale className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Under review</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    An admin is reviewing this challenge before the final
                    result.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {isDisputed ? (
            <Card className="ring-amber-500/25">
              <CardContent className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                  <Scale className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Dispute under review</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    You&apos;ve disputed this result. An admin will re-review
                    your proof and update the outcome.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {canDispute ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Disagree with this result?
              </h2>
              <DisputeForm challengeId={challenge.id} />
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-xs">Commitment</p>
                <p className="text-3xl font-bold tracking-tight text-emerald-400 tabular-nums">
                  {formatCurrency(challenge.amount, challenge.currency)}
                </p>
              </div>
              <div className="border-border/60 space-y-2.5 border-t pt-4">
                {challenge.rank ? (
                  <MetaRow label="Leaderboard rank">#{challenge.rank}</MetaRow>
                ) : null}
                <MetaRow label="Duration">
                  {challenge.durationDays} days
                </MetaRow>
                {isUpcoming && challenge.startDate ? (
                  <MetaRow label="Starts">
                    {formatDate(challenge.startDate)}
                  </MetaRow>
                ) : null}
                {challenge.endDate ? (
                  <MetaRow label="Ends">
                    {formatDate(challenge.endDate)}
                  </MetaRow>
                ) : null}
                <MetaRow label="Verification">{verificationMeta.label}</MetaRow>
                <MetaRow label="Source">{challenge.verificationSource}</MetaRow>
                <MetaRow label="Visibility">{visibilityMeta.label}</MetaRow>
              </div>
              <ShareButton
                url={shareUrlFor(challenge)}
                title={challenge.title}
                message={shareMessage}
                variant="default"
                label="Share this challenge"
                className="w-full"
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
