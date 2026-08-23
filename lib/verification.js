// Deterministic challenge verification engine. Pure and testable — it takes a
// challenge's rule plus a list of normalized activities and computes progress
// and whether the requirement is satisfied. No DB, no React, no provider
// specifics (PLAN.md). The final WON/LOST decision still requires an admin.
import { ACTIVITY_TYPE, REQUIREMENT_TYPE } from "@/lib/constants";

const DAY = 86_400_000;

// Activity types that count for each other (gym vs. weights overlap heavily).
const INTERCHANGEABLE = [[ACTIVITY_TYPE.WORKOUT, ACTIVITY_TYPE.STRENGTH]];

function typeMatches(challengeType, activityType) {
  if (!challengeType || challengeType === ACTIVITY_TYPE.OTHER) return true;
  if (challengeType === activityType) return true;
  return INTERCHANGEABLE.some(
    (group) => group.includes(challengeType) && group.includes(activityType)
  );
}

// How much a single activity contributes, in the metric's unit.
function metricValue(metric, activity) {
  switch (metric) {
    case "distance":
      return activity.distanceMeters != null
        ? Number(activity.distanceMeters) / 1000 // km
        : 0;
    case "duration":
      return activity.durationSeconds != null
        ? Number(activity.durationSeconds) / 60 // minutes
        : 0;
    case "steps":
      return activity.steps != null ? Number(activity.steps) : 0;
    case "frequency":
    case "sessions":
      return 1; // each qualifying activity is one session
    default:
      return 0;
  }
}

function utcDateKey(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

// Metrics that can't come from a wearable (e.g. body weight) → manual only.
const AUTO_METRICS = new Set([
  "distance",
  "duration",
  "steps",
  "frequency",
  "sessions",
]);

/**
 * Evaluate a challenge against activities.
 * @param {object} challenge { requirementType, targetValue, frequencyPerWeek,
 *   durationDays, startDate, endDate, activityType, metric, unit }
 * @param {Array} activities normalized activities (activityType, startedAt,
 *   durationSeconds, distanceMeters, steps)
 * @returns {object} progress snapshot
 */
export function evaluateChallenge(challenge, activities = []) {
  const metric = challenge?.metric ?? "duration";
  const unit = challenge?.unit ?? null;
  const requirementType = challenge?.requirementType ?? REQUIREMENT_TYPE.TOTAL;

  if (!AUTO_METRICS.has(metric)) {
    return {
      autoVerifiable: false,
      requirementType,
      metric,
      unit,
      target:
        challenge?.targetValue != null ? Number(challenge.targetValue) : null,
      progressValue: 0,
      progressPercent: 0,
      satisfied: false,
      qualifyingCount: 0,
      detail: { reason: "Metric requires manual verification." },
      days: [],
    };
  }

  const startMs = challenge?.startDate
    ? new Date(challenge.startDate).getTime()
    : null;
  const endMs = challenge?.endDate
    ? new Date(challenge.endDate).getTime()
    : null;

  const qualifying = (activities ?? []).filter((activity) => {
    if (!typeMatches(challenge?.activityType, activity.activityType))
      return false;
    const t = activity.startedAt
      ? new Date(activity.startedAt).getTime()
      : null;
    if (t == null) return false;
    if (startMs != null && t < startMs) return false;
    if (endMs != null && t > endMs) return false;
    return true;
  });

  if (requirementType === REQUIREMENT_TYPE.DAILY) {
    return evaluateDaily(challenge, qualifying, metric, unit);
  }
  if (requirementType === REQUIREMENT_TYPE.FREQUENCY) {
    return evaluateFrequency(challenge, qualifying, metric, unit, startMs);
  }
  return evaluateTotal(challenge, qualifying, metric, unit);
}

function evaluateTotal(challenge, qualifying, metric, unit) {
  const target =
    challenge?.targetValue != null ? Number(challenge.targetValue) : 0;
  const total = qualifying.reduce((sum, a) => sum + metricValue(metric, a), 0);
  const progressValue = round2(total);
  const percent = target > 0 ? clampPercent((total / target) * 100) : 0;
  return {
    autoVerifiable: true,
    requirementType: REQUIREMENT_TYPE.TOTAL,
    metric,
    unit,
    target: round2(target),
    progressValue,
    progressPercent: percent,
    satisfied: target > 0 && total >= target,
    qualifyingCount: qualifying.length,
    detail: { total: progressValue, target: round2(target) },
    days: [],
  };
}

function evaluateDaily(challenge, qualifying, metric, unit) {
  const dailyTarget =
    challenge?.targetValue != null ? Number(challenge.targetValue) : 0;
  const durationDays = Number(challenge?.durationDays) || 0;

  const byDay = new Map();
  for (const activity of qualifying) {
    const key = utcDateKey(activity.startedAt);
    byDay.set(key, (byDay.get(key) ?? 0) + metricValue(metric, activity));
  }

  const days = [...byDay.entries()]
    .map(([date, value]) => ({
      date,
      value: round2(value),
      satisfied: dailyTarget > 0 ? value >= dailyTarget : value > 0,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const daysCompleted = days.filter((d) => d.satisfied).length;
  const percent =
    durationDays > 0 ? clampPercent((daysCompleted / durationDays) * 100) : 0;
  return {
    autoVerifiable: true,
    requirementType: REQUIREMENT_TYPE.DAILY,
    metric,
    unit,
    target: durationDays,
    progressValue: daysCompleted,
    progressPercent: percent,
    satisfied: durationDays > 0 && daysCompleted >= durationDays,
    qualifyingCount: qualifying.length,
    detail: { daysCompleted, durationDays, dailyTarget: round2(dailyTarget) },
    days,
  };
}

function evaluateFrequency(challenge, qualifying, metric, unit, startMs) {
  const perWeek = Number(challenge?.frequencyPerWeek) || 0;
  const durationDays = Number(challenge?.durationDays) || 0;
  const weeks = Math.max(1, Math.ceil(durationDays / 7));
  const anchor =
    startMs ??
    Math.min(
      ...qualifying.map((a) => new Date(a.startedAt).getTime()),
      Date.now()
    );

  // Optional per-session minimum: targetValue in the metric's unit.
  const sessionMin =
    challenge?.targetValue != null ? Number(challenge.targetValue) : 0;

  const byWeek = new Map();
  for (const activity of qualifying) {
    if (sessionMin > 0 && metricValue(metric, activity) < sessionMin) continue;
    const weekIndex = Math.floor(
      (new Date(activity.startedAt).getTime() - anchor) / (7 * DAY)
    );
    if (weekIndex < 0 || weekIndex >= weeks) continue;
    byWeek.set(weekIndex, (byWeek.get(weekIndex) ?? 0) + 1);
  }

  let weeksCompleted = 0;
  for (let i = 0; i < weeks; i += 1) {
    if (perWeek > 0 && (byWeek.get(i) ?? 0) >= perWeek) weeksCompleted += 1;
  }
  const percent = weeks > 0 ? clampPercent((weeksCompleted / weeks) * 100) : 0;
  return {
    autoVerifiable: true,
    requirementType: REQUIREMENT_TYPE.FREQUENCY,
    metric,
    unit,
    target: weeks,
    progressValue: weeksCompleted,
    progressPercent: percent,
    satisfied: perWeek > 0 && weeksCompleted >= weeks,
    qualifyingCount: qualifying.length,
    detail: { weeksCompleted, weeks, perWeek },
    days: [],
  };
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}
