// Provider-agnostic helpers for the fitness layer: OAuth redirect URIs, unit
// conversions and a lightweight anti-fraud screen. Kept separate from provider
// SDK calls so it stays pure and testable.
import { ACTIVITY_TYPE } from "@/lib/constants";

/** OAuth callback URL for a provider slug. No trailing slash on the base. */
export function redirectUri(slug) {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/api/fitness/${slug}/callback`;
}

export function metersToKm(meters) {
  return meters == null ? null : Number(meters) / 1000;
}

export function secondsToMinutes(seconds) {
  return seconds == null ? null : Number(seconds) / 60;
}

/** Average speed in km/h, or null when it can't be computed. */
export function activitySpeedKmh(activity) {
  const meters = Number(activity?.distanceMeters);
  const seconds = Number(activity?.durationSeconds);
  if (!Number.isFinite(meters) || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return (meters / seconds) * 3.6;
}

// Physically impossible average speeds per activity type (km/h). An activity
// above these is almost certainly GPS error or a spoof and gets flagged for
// admin review — but is never silently dropped (a legit outlier can be cleared).
const MAX_SPEED_KMH = {
  [ACTIVITY_TYPE.RUN]: 30,
  [ACTIVITY_TYPE.WALK]: 12,
  [ACTIVITY_TYPE.CYCLE]: 80,
  [ACTIVITY_TYPE.SWIM]: 10,
};

/**
 * Screen a normalized activity for obvious data-integrity problems.
 * @returns {{ flagged: boolean, reason: string|null }}
 */
export function screenActivity(activity) {
  const duration = Number(activity?.durationSeconds);
  const distance = Number(activity?.distanceMeters);

  if (Number.isFinite(duration) && duration < 0) {
    return { flagged: true, reason: "Negative duration." };
  }
  if (Number.isFinite(distance) && distance < 0) {
    return { flagged: true, reason: "Negative distance." };
  }

  const limit = MAX_SPEED_KMH[activity?.activityType];
  const speed = activitySpeedKmh(activity);
  if (limit != null && speed != null && speed > limit) {
    return {
      flagged: true,
      reason: `Implausible average speed (${speed.toFixed(1)} km/h for ${activity.activityType}).`,
    };
  }
  return { flagged: false, reason: null };
}
