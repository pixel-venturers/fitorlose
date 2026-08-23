import { getDisputes } from "@/lib/queries/admin";

import { DisputesTable } from "@/components/admin/DisputesTable";

export const metadata = { title: "Admin · Disputes" };

export default async function Page() {
  const disputes = await getDisputes();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Disputes</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Settlement is paused while a dispute is open. Resolve using recorded
        activity and proof.
      </p>
      <div className="mt-6">
        <DisputesTable disputes={disputes} />
      </div>
    </div>
  );
}
