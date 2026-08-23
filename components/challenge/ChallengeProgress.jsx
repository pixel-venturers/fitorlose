import { Progress } from "@/components/ui/progress";

/** Progress bar with label, percent and optional days-left hint. */
export function ChallengeProgress({ percent = 0, label, daysLeft }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label ?? "Progress"}</span>
        <span className="text-muted-foreground tabular-nums">{Math.round(percent)}%</span>
      </div>
      <Progress value={percent} className="mt-2 h-2" />
      {typeof daysLeft === "number" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {daysLeft === 0 ? "Challenge complete" : `${daysLeft} days left`}
        </p>
      ) : null}
    </div>
  );
}
