import { getAdminChallenges } from "@/lib/queries/admin";

import { ChallengesTable } from "@/components/admin/ChallengesTable";

export const metadata = { title: "Admin · Challenges" };

export default async function Page() {
  const { items } = await getAdminChallenges({ pageSize: 100 });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Challenges</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every challenge across the platform. Filter by status, verification,
        category or search, and click a name or title for full details.
      </p>
      <div className="mt-6">
        <ChallengesTable challenges={items} />
      </div>
    </div>
  );
}
