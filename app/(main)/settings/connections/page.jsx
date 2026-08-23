import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { PROVIDER_META } from "@/lib/constants";
import { query } from "@/lib/db";

import { Container } from "@/components/common/Container";
import { FitnessConnections } from "@/components/fitness/FitnessConnections";

export const metadata = {
  title: "Fitness Connections",
  description:
    "Connect a fitness account to automatically verify your challenges.",
};

export default async function Page({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?redirect_url=/settings/connections");

  const rows = await query(
    `SELECT provider, connected, "lastSyncedAt"
       FROM "connectedAccount" WHERE "userId" = $1`,
    [user.id]
  );
  const byDbKey = Object.fromEntries(rows.map((row) => [row.provider, row]));

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

  const flash = (await searchParams) ?? {};

  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Fitness connections
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect a fitness account to verify eligible challenges automatically.
          Your activities import in the background — weight-loss and other
          non-trackable goals still use manual proof.
        </p>
      </header>

      <div className="mt-8">
        <FitnessConnections
          providers={providers}
          flash={{
            connected: flash.connected ?? null,
            error: flash.error ?? null,
          }}
        />
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        We only request the minimum activity data needed to verify your
        challenges, never store your provider password, and keep your tokens
        encrypted. Disconnecting keeps your past verification history intact.
      </p>
    </Container>
  );
}
