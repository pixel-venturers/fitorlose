import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  Eye,
  Flame,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

import { CURRENCY } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { getLiveStats } from "@/lib/queries/stats";

import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionHeading } from "@/components/common/SectionHeading";
import { StatCard } from "@/components/common/StatCard";

export const metadata = {
  title: "Live Statistics",
  description:
    "Real-time activity across FitOrLose — visitors, challenges, and money committed.",
};

export default async function Page() {
  const stats = await getLiveStats();
  const num = (value) => (value == null ? "—" : formatNumber(value));

  const visitorStats = [
    {
      label: "Online now",
      value: num(stats.online),
      hint: "Live with analytics (Phase 6)",
      icon: Flame,
      valueClassName: "text-emerald-400",
    },
    {
      label: "Visitors since launch",
      value: num(stats.visitorsSinceLaunch),
      icon: Eye,
      valueClassName: "text-blue-400",
    },
    {
      label: "Unique visitors",
      value: num(stats.uniqueVisitorsSinceLaunch),
      hint: "Since launch",
      icon: Users,
      valueClassName: "text-blue-400",
    },
    {
      label: "Visitors this month",
      value: num(stats.visitorsThisMonth),
      icon: CalendarDays,
      valueClassName: "text-blue-400",
    },
    {
      label: "Unique this month",
      value: num(stats.uniqueVisitorsThisMonth),
      icon: Users,
      valueClassName: "text-blue-400",
    },
    {
      label: "Visitors today",
      value: num(stats.visitorsToday),
      icon: CalendarDays,
      valueClassName: "text-blue-400",
    },
  ];

  const productStats = [
    {
      label: "Challenges created",
      value: formatNumber(stats.totalChallenges),
      icon: Activity,
    },
    {
      label: "Active challenges",
      value: formatNumber(stats.activeChallenges),
      icon: Flame,
      valueClassName: "text-blue-400",
    },
    {
      label: "Challenges completed",
      value: formatNumber(stats.challengesCompleted),
      icon: Trophy,
      valueClassName: "text-emerald-400",
    },
    {
      label: "Challenges won",
      value: formatNumber(stats.challengesWon),
      icon: Trophy,
      valueClassName: "text-emerald-400",
    },
  ];

  const moneyStats = [
    {
      label: "Total committed",
      value: formatCurrency(stats.totalCommitted, CURRENCY.USD),
      icon: Wallet,
      valueClassName: "text-blue-400",
    },
    {
      label: "Money won",
      value: formatCurrency(stats.totalReturned, CURRENCY.USD),
      icon: CircleDollarSign,
      valueClassName: "text-emerald-400",
    },
    {
      label: "Held in commitments",
      value: formatCurrency(stats.totalLost, CURRENCY.USD),
      icon: Wallet,
      valueClassName: "text-amber-400",
    },
  ];

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        eyebrow="Live statistics"
        title="The numbers behind the commitment"
        description="Everything you see here is derived from real activity. Nothing is fabricated."
      />

      <section className="mt-14">
        <SectionHeading
          eyebrow="Audience"
          title="Visitors & reach"
          description="Traffic and audience metrics are measured with PostHog."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {visitorStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Product"
          title="Challenges"
          description="Every challenge created across FitOrLose, counted live."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {productStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Money"
          title="Commitments & settlements"
          description={`Approx. ${formatCurrency(stats.totalCommitted, CURRENCY.USD)} committed and counting.`}
        />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {moneyStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>
    </Container>
  );
}
