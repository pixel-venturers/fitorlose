import { Trophy } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";

export function LeaderboardTable({ challenges, emptyTitle, emptyDescription, emptyAction }) {
  if (!challenges?.length) {
    return (
      <EmptyState
        icon={Trophy}
        title={emptyTitle ?? "The leaderboard is waiting for its first commitment."}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {challenges.map((challenge) => (
        <LeaderboardRow key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
}
