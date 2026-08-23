import Link from "next/link";
import { redirect } from "next/navigation";
import { ROUTES } from "@/config/site";
import { ArrowRight, Plus, Watch } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { CHALLENGE_STATUS, CURRENCY } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { getUserChallenges } from "@/lib/queries/challenges";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { PaymentButton } from "@/components/challenge/PaymentButton";
import { Container } from "@/components/common/Container";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";

export const metadata = {
  title: "Dashboard",
  description: "Manage your challenges, track progress and submit proof.",
};

const AWAITING = [
  CHALLENGE_STATUS.AWAITING_VERIFICATION,
  CHALLENGE_STATUS.VERIFIED,
  CHALLENGE_STATUS.UNDER_REVIEW,
];
const COMPLETED = [CHALLENGE_STATUS.WON, CHALLENGE_STATUS.LOST];

function ChallengeGrid({ challenges, emptyTitle, emptyDescription }) {
  if (!challenges.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button asChild>
            <Link href={ROUTES.create}>
              <Plus />
              Create a Challenge
            </Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} owner />
      ))}
    </div>
  );
}

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?redirect_url=/dashboard");
  const challenges = await getUserChallenges(user.id, user);
  const pending = challenges.filter(
    (challenge) => challenge.status === CHALLENGE_STATUS.PAYMENT_PENDING
  );
  const active = challenges.filter(
    (challenge) => challenge.status === CHALLENGE_STATUS.ACTIVE
  );
  const awaiting = challenges.filter((challenge) =>
    AWAITING.includes(challenge.status)
  );
  const completed = challenges.filter((challenge) =>
    COMPLETED.includes(challenge.status)
  );
  const wonCount = completed.filter(
    (challenge) => challenge.status === CHALLENGE_STATUS.WON
  ).length;
  const moneyWon = challenges
    .filter((challenge) => challenge.status === CHALLENGE_STATUS.WON)
    .reduce((sum, challenge) => sum + challenge.amount, 0);

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your challenges
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track progress, submit proof and manage your commitments.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={ROUTES.connections}>
              <Watch />
              Fitness connections
            </Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.create}>
              Challenge Myself Now
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active"
          value={active.length}
          valueClassName="text-blue-400"
        />
        <StatCard label="Awaiting review" value={awaiting.length} />
        <StatCard
          label="Challenges completed"
          value={wonCount}
          valueClassName="text-emerald-400"
        />
        <StatCard
          label="Money won"
          value={formatCurrency(moneyWon, CURRENCY.USD)}
          valueClassName="text-emerald-400"
        />
      </div>

      {pending.length > 0 ? (
        <section className="mt-8 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Payment pending
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Complete payment to activate{" "}
            {pending.length === 1 ? "this challenge" : "these challenges"}.
          </p>
          <ul className="mt-3 space-y-2">
            {pending.map((challenge) => (
              <li
                key={challenge.id}
                className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-lg p-3 ring-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/challenges/${challenge.id}?from=dashboard`}
                    className="font-medium hover:underline"
                  >
                    {challenge.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {formatCurrency(challenge.amount, challenge.currency)} ·{" "}
                    {challenge.categoryLabel}
                  </p>
                </div>
                <PaymentButton
                  challengeId={challenge.id}
                  label="Complete payment"
                  size="sm"
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Tabs defaultValue="all" className="mt-10">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="awaiting">Awaiting</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ChallengeGrid
            challenges={challenges}
            emptyTitle="No challenges yet."
            emptyDescription="Put some money behind your first fitness goal."
          />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <ChallengeGrid
            challenges={active}
            emptyTitle="Nothing active right now."
            emptyDescription="Start a new challenge to get moving."
          />
        </TabsContent>
        <TabsContent value="awaiting" className="mt-6">
          <ChallengeGrid
            challenges={awaiting}
            emptyTitle="Nothing awaiting review."
            emptyDescription="Submitted proof waiting on verification shows up here."
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <ChallengeGrid
            challenges={completed}
            emptyTitle="No completed challenges yet."
            emptyDescription="Your wins and losses will be recorded here."
          />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
