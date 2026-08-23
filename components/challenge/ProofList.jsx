import { FileImage, FileText, FileVideo, Upload } from "lucide-react";

import { PROOF_TYPE } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";

import { ChallengeStatusBadge } from "@/components/challenge/ChallengeStatusBadge";
import { EmptyState } from "@/components/common/EmptyState";

const PROOF_ICON = {
  [PROOF_TYPE.PHOTO]: FileImage,
  [PROOF_TYPE.SCREENSHOT]: FileImage,
  [PROOF_TYPE.VIDEO]: FileVideo,
  [PROOF_TYPE.DOCUMENT]: FileText,
  [PROOF_TYPE.ACTIVITY]: Upload,
  [PROOF_TYPE.OTHER]: FileText,
};

export function ProofList({ proofs }) {
  if (!proofs?.length) {
    return (
      <EmptyState
        icon={Upload}
        title="No proof submitted yet"
        description="Submitted proof and its review status will appear here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {proofs.map((proof) => {
        const IconComponent = PROOF_ICON[proof.type] ?? FileText;
        return (
          <li key={proof.id} className="flex items-center gap-3 px-4 py-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <IconComponent className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{proof.label}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(proof.submittedAt)}</p>
            </div>
            <ChallengeStatusBadge status={proof.status} />
          </li>
        );
      })}
    </ul>
  );
}
