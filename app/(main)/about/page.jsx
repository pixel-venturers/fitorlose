import Link from "next/link";
import { AGENCY, ROUTES } from "@/config/site";
import { ArrowRight, ArrowUpRight, Quote } from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/formatters";
import { getLiveStats } from "@/lib/queries/stats";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { Faq } from "@/components/common/Faq";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionHeading } from "@/components/common/SectionHeading";
import { StatCard } from "@/components/common/StatCard";
import { HowItWorks } from "@/components/landing/HowItWorks";

export const metadata = {
  title: "About",
  description:
    "Why FitOrLose exists: putting real money behind a fitness goal is the most honest motivation there is.",
};

const FAQS = [
  {
    q: "Is this gambling?",
    a: "No. You're not betting against anyone or relying on chance. You set a measurable goal, and the outcome depends entirely on whether you complete it. Win and your commitment comes back to you.",
  },
  {
    q: "What happens to the money if I win?",
    a: "Your full commitment is returned to you as a separate reward transaction once your result is verified and settled. There are no partial rewards — you either hit the goal or you don't.",
  },
  {
    q: "How are challenges verified?",
    a: "Where possible, activity is verified automatically from connected fitness providers like Strava. When a goal can't be machine-verified — like weight loss — you submit proof that an admin reviews before settlement.",
  },
  {
    q: "What if I lose?",
    a: "If you don't meet the goal within the challenge window, the commitment is forfeited. That real consequence is exactly what makes the commitment work.",
  },
  {
    q: "Can I stay anonymous?",
    a: "Yes. Every challenge can be public, anonymous, or private. Anonymous challenges still appear on the leaderboard, but never reveal your identity or private details.",
  },
];

export default async function Page() {
  const stats = await getLiveStats();
  return (
    <>
      <Container className="py-14 sm:py-20">
        <PageHeader
          eyebrow="About"
          title="Put money behind your goals."
          description="FitOrLose turns a fitness intention into a real commitment — because the surest way to follow through is to give yourself something to lose."
        />
      </Container>

      <Container size="narrow" className="pb-6">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Why we built this
            </h2>
            <div className="text-muted-foreground mt-3 space-y-3 text-sm text-pretty">
              <p>
                Motivation fades. Life gets busy. The gap between what we intend
                to do and what we actually do is where most fitness goals
                quietly die.
              </p>
              <p>
                FitOrLose closes that gap with the oldest trick in behavioural
                science — a commitment device. When there's real money on the
                line, "I'll start tomorrow" stops being an option.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              The idea behind commitment
            </h2>
            <div className="text-muted-foreground mt-3 space-y-3 text-sm text-pretty">
              <p>
                A goal without stakes is just a wish. Attach a cost to failure
                and the same goal suddenly gets your full attention.
              </p>
              <p>
                We keep it fair and transparent: measurable goals, honest
                verification, and a clear win-or-lose outcome. No fine print, no
                partial credit.
              </p>
            </div>
          </div>
        </div>

        <figure className="bg-card ring-foreground/10 mt-10 rounded-xl p-6 ring-1">
          <Quote className="text-primary size-6" />
          <blockquote className="mt-3 text-lg font-medium text-balance">
            The best time to bet on yourself is when it actually costs you
            something.
          </blockquote>
        </figure>
      </Container>

      <Container className="py-16">
        <HowItWorks />
      </Container>

      <Container className="pb-6">
        <SectionHeading
          eyebrow="The numbers"
          title="A community that shows up"
          align="center"
        />
        <div className="mx-auto mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Committed",
              value: formatCurrency(stats.totalCommitted, stats.currency),
              valueClassName: "text-blue-400",
            },
            {
              label: "Challenges",
              value: formatNumber(stats.totalChallenges),
              valueClassName: "text-blue-400",
            },
            {
              label: "Challenges completed",
              value: formatNumber(stats.challengesCompleted),
              valueClassName: "text-emerald-400",
            },
            {
              label: "Money won",
              value: formatCurrency(stats.totalReturned, stats.currency),
              valueClassName: "text-emerald-400",
            },
          ].map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              valueClassName={stat.valueClassName}
            />
          ))}
        </div>
      </Container>

      <Container size="narrow" className="py-16">
        <SectionHeading
          eyebrow="Who's behind FitOrLose"
          title="Built by people who needed it"
        />
        <p className="text-muted-foreground mt-4 text-sm text-pretty">
          FitOrLose started as a bet between friends who were tired of
          abandoning their own fitness goals. It turned out that the money
          wasn't really the point — the accountability was. We're a small team
          building the platform we wished existed: simple, honest, and just
          high-stakes enough to make you follow through.
        </p>
        <p className="text-muted-foreground mt-4 flex text-sm">
          Designed and built by&nbsp;
          <Link
            href={AGENCY.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex font-medium text-blue-500 underline-offset-4 hover:text-blue-500/80 hover:underline"
          >
            {AGENCY.name}
            <ArrowUpRight size={12} />
          </Link>
        </p>
      </Container>

      <Container size="narrow" className="pb-16">
        <SectionHeading eyebrow="FAQs" title="Questions, answered" />
        <Faq items={FAQS} className="mt-6" />
      </Container>

      <Container className="pb-20">
        <div className="via-primary/10 ring-foreground/10 relative overflow-hidden rounded-2xl bg-linear-to-br from-sky-500/15 to-indigo-600/15 p-8 text-center ring-1 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Ready to put something on the line?
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm">
            Set a goal, commit, and get to work. Your next challenge starts now.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6 text-base">
              <Link href={ROUTES.create}>
                Challenge Myself Now
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6 text-base">
              <Link href={ROUTES.rules}>Read the rules</Link>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
