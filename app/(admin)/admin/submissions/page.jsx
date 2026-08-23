import { getPendingSubmissions } from "@/lib/queries/admin";

import { SubmissionsTable } from "@/components/admin/SubmissionsTable";

export const metadata = { title: "Admin · Submissions" };

export default async function Page() {
  const submissions = await getPendingSubmissions();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Review submitted proof before settlement — click{" "}
        <span className="text-foreground font-medium">View</span> to see the
        uploaded photos/videos. Flagged items need extra scrutiny.
      </p>
      <div className="mt-6">
        <SubmissionsTable submissions={submissions} />
      </div>
    </div>
  );
}
