import Link from "next/link";
import { ROUTES } from "@/config/site";
import { CHALLENGE_CATEGORIES } from "@/data/challenge-categories";
import { ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/queries/challenges";
import { getLiveStats, getRecentActivity } from "@/lib/queries/stats";

import { Button } from "@/components/ui/button";
import { CategoryTile } from "@/components/challenge/CategoryTile";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LeaderboardPagination } from "@/components/leaderboard/LeaderboardPagination";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export const metadata = {
  title: { absolute: "FitOrLose — Put money behind your fitness goal." },
  description:
    "The fitness commitment leaderboard. Put real money on a measurable goal, complete it and win it back, fall short and lose it.",
};

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const viewer = await getCurrentUser();
  const [{ items, page, totalPages }, stats, activity] = await Promise.all([
    getLeaderboard({ page: Number(params?.page) || 1, viewer }),
    getLiveStats(),
    getRecentActivity(),
  ]);

  return (
    <>
      <Hero stats={stats} activity={activity} />

      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Leaderboard"
            title="Who's putting the most on the line"
            description="Ranked by commitment. The bigger the stake, the higher the rank."
          />
          <Button asChild variant="outline" className="shrink-0">
            <Link href={ROUTES.create}>
              Challenge Myself Now
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          <LeaderboardTable challenges={items} />
          <LeaderboardPagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/"
          />
        </div>
      </Container>

      <Container className="pb-6">
        <SectionHeading
          eyebrow="Browse"
          title="Popular challenge types"
          description="Pick a category and start a commitment that fits your goal."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGE_CATEGORIES.map((category) => (
            <CategoryTile
              key={category.slug}
              category={category}
              glow={false}
            />
          ))}
        </div>
      </Container>

      <Container className="py-16 sm:py-20">
        <HowItWorks />
      </Container>
    </>
  );
}
