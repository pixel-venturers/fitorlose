import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { PROVIDER_META } from "@/lib/constants";
import { query } from "@/lib/db";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { getUserChallenges } from "@/lib/queries/challenges";
import { getUserProfileStats } from "@/lib/queries/stats";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { Container } from "@/components/common/Container";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { UserAvatar } from "@/components/common/UserAvatar";
import { FitnessConnections } from "@/components/fitness/FitnessConnections";

export const metadata = {
  title: "Your Profile",
  description: "Your challenge history, stats and connected fitness accounts.",
};

function initialsOf(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?redirect_url=/profile");

  const avatarUrl = user.imageUrl ?? null;

  const [stats, challenges, accountRows] = await Promise.all([
    getUserProfileStats(user.id),
    getUserChallenges(user.id, user),
    query(
      `SELECT provider, connected, "lastSyncedAt" FROM "connectedAccount" WHERE "userId" = $1`,
      [user.id]
    ),
  ]);

  const byDbKey = Object.fromEntries(
    accountRows.map((row) => [row.provider, row])
  );
  const providers = Object.values(PROVIDER_META).map((meta) => {
    const row = byDbKey[meta.dbKey];
    return {
      slug: meta.slug,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      enabled: meta.enabled,
      connectVia: meta.connectVia,
      connected: Boolean(row?.connected),
      lastSyncedAt: row?.lastSyncedAt
        ? new Date(row.lastSyncedAt).toISOString()
        : null,
    };
  });

  return (
    <Container className="py-12 sm:py-16">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <UserAvatar
          src={avatarUrl}
          initials={initialsOf(user.name)}
          gradient="from-sky-500 to-indigo-600"
          size="xl"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.name ?? "Member"}
          </h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              Joined {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Challenges" value={stats.totalChallenges} />
        <StatCard
          label="Won"
          value={stats.won}
          valueClassName="text-emerald-400"
        />
        <StatCard
          label="Lost"
          value={stats.lost}
          valueClassName="text-red-400"
        />
        <StatCard label="Win rate" value={formatPercent(stats.winRate)} />
        <StatCard
          label="Committed"
          value={formatCurrency(stats.totalCommitted, user.currency)}
        />
        <StatCard
          label="Returned"
          value={formatCurrency(stats.totalReturned, user.currency)}
          valueClassName="text-emerald-400"
        />
      </div>

      <Tabs defaultValue="challenges" className="mt-10">
        <TabsList>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="accounts">Fitness accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-6">
          {challenges.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} owner />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your challenge history will appear here."
              description="Put some money behind your first fitness goal."
            />
          )}
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <FitnessConnections
            providers={providers}
            flash={{ connected: null, error: null }}
          />
        </TabsContent>
      </Tabs>
    </Container>
  );
}
