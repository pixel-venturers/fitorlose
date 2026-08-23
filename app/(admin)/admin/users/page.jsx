import { getAdminUsers } from "@/lib/queries/admin";

import { UsersTable } from "@/components/admin/UsersTable";

export const metadata = { title: "Admin · Users" };

export default async function Page() {
  const users = await getAdminUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Members, their activity and account status. Search by name, email or
        UUID; sort by challenges or committed.
      </p>
      <div className="mt-6">
        <UsersTable users={users} />
      </div>
    </div>
  );
}
