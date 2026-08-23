import { getSettlementQueue } from "@/lib/queries/admin";

import { SettlementsTable } from "@/components/admin/SettlementsTable";

export const metadata = { title: "Admin · Settlements" };

export default async function Page() {
  const settlements = await getSettlementQueue();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Settlements</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Verified wins awaiting reward. Each reward is confirmed explicitly and
        can never be sent twice.
      </p>
      <div className="mt-6">
        <SettlementsTable settlements={settlements} />
      </div>
    </div>
  );
}
