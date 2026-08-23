import { CircleDollarSign, Trophy } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { CURRENCY } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { getWonLeaderboard } from "@/lib/queries/challenges";
import { getLiveStats } from "@/lib/queries/stats";

import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { LeaderboardPagination } from "@/components/leaderboard/LeaderboardPagination";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

export const metadata = {
  title: "Challenges Won",
  description:
    "Members who put money on the line and delivered. Every win here was verified before settlement.",
};

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const viewer = await getCurrentUser();
  const stats = await getLiveStats();
  const { items, page, totalPages } = await getWonLeaderboard({
    page: Number(params?.page) || 1,
    viewer,
  });

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        eyebrow="Hall of wins"
        title="Challenges Won"
        description="Real commitments, verified results. These members set a goal, put money behind it, and won it back."
      />

      <div className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-4">
        <StatCard
          label="Challenges won"
          value={formatNumber(stats.challengesWon)}
          icon={Trophy}
          valueClassName="text-emerald-400"
        />
        <StatCard
          label="Money won"
          value={formatCurrency(stats.totalReturned, CURRENCY.USD)}
          icon={CircleDollarSign}
          valueClassName="text-emerald-400"
        />
      </div>

      <div className="mt-10">
        <LeaderboardTable
          challenges={items}
          emptyTitle="No wins yet."
          emptyDescription="Completed and verified challenges will appear here."
        />
        <LeaderboardPagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/challenges-won"
        />
      </div>
    </Container>
  );
}
