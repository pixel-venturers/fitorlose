import { getTransactions } from "@/lib/queries/admin";

import { TransactionsTable } from "@/components/admin/TransactionsTable";

export const metadata = { title: "Admin · Transactions" };

export default async function Page() {
  const transactions = await getTransactions({ limit: 200 });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Commitments, rewards and refunds. Click a user or transaction id for
        details, and sort by amount. PostgreSQL is the source of truth for
        money.
      </p>
      <div className="mt-6">
        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}
