import { getStatusMeta } from "@/lib/constants";

import { ToneBadge } from "@/components/common/ToneBadge";

/** Status badge that never relies on color alone — always shows the status label. */
export function ChallengeStatusBadge({ status, className, showDot = true }) {
  const { label, tone } = getStatusMeta(status);
  return <ToneBadge label={label} tone={tone} className={className} showDot={showDot} />;
}
