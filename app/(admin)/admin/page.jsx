import Link from "next/link";
import {
  Activity,
  ChevronRight,
  CircleDollarSign,
  Flame,
  HandCoins,
  Inbox,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/formatters";
import {
  getDisputes,
  getPendingSubmissions,
  getSettlementQueue,
} from "@/lib/queries/admin";
import { getAdminStats } from "@/lib/queries/stats";

import { StatCard } from "@/components/common/StatCard";

export const metadata = { title: "Admin · Overview" };

function PreviewCard({ title, href, icon: IconComponent, children }) {
  return (
    <div className="bg-card ring-foreground/10 rounded-xl ring-1">
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
          <IconComponent className="text-muted-foreground size-4" />
          {title}
        </h2>
        <Link
          href={href}
          className="text-primary inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
        >
          View all
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
      <ul className="divide-border/60 divide-y">{children}</ul>
    </div>
  );
}

export default async function Page() {
  const [stats, submissions, settlements, disputes] = await Promise.all([
    getAdminStats(),
    getPendingSubmissions(),
    getSettlementQueue(),
    getDisputes(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Platform health, review queues and settlement at a glance.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Signed up users"
          value={formatNumber(stats.usersTotal)}
          icon={Users}
        />
        <StatCard
          label="Challenges created"
          value={formatNumber(stats.challengesTotal)}
          icon={Activity}
        />
        <StatCard
          label="Challenges active"
          value={formatNumber(stats.activeChallenges)}
          icon={Flame}
        />
        <StatCard
          label="Pending reviews"
          value={stats.pendingReviews}
          icon={Inbox}
        />
        <StatCard
          label="Open disputes"
          value={stats.openDisputes}
          icon={ShieldAlert}
        />
        <StatCard
          label="Settlement queue"
          value={stats.settlementQueue}
          icon={HandCoins}
        />
        <StatCard
          label="Money committed"
          value={formatCurrency(stats.moneyCommitted)}
          icon={Wallet}
        />
        <StatCard
          label="Money held"
          value={formatCurrency(stats.moneyHeld)}
          hint="Locked in active commitments"
          icon={CircleDollarSign}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <PreviewCard
          title="Pending reviews"
          href="/admin/submissions"
          icon={Inbox}
        >
          {submissions.slice(0, 4).map((submission) => (
            <li
              key={submission.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {submission.challenge.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  {submission.user.name}
                </p>
              </div>
              {submission.flagged ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                  Flagged
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">
                  {submission.type}
                </span>
              )}
            </li>
          ))}
        </PreviewCard>

        <PreviewCard
          title="Settlement queue"
          href="/admin/settlements"
          icon={HandCoins}
        >
          {settlements.slice(0, 4).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.challenge.title}</p>
                <p className="text-muted-foreground text-xs">
                  {item.user.name}
                </p>
              </div>
              <span className="font-medium text-emerald-400 tabular-nums">
                {formatCurrency(item.amount, item.currency)}
              </span>
            </li>
          ))}
        </PreviewCard>
      </div>

      <div className="mt-4">
        <PreviewCard
          title="Open disputes"
          href="/admin/disputes"
          icon={ShieldAlert}
        >
          {disputes.map((dispute) => (
            <li
              key={dispute.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {dispute.challenge.title}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {dispute.reason}
                </p>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">
                {dispute.user.name}
              </span>
            </li>
          ))}
        </PreviewCard>
      </div>
    </div>
  );
}
