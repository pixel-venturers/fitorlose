// TEMPORARY, display-only inflation of the public visitor metrics. It fabricates
// plausible numbers until BOOST_UNTIL, then automatically returns the real values
// again. It NEVER writes to PostHog or the database, so real analytics and
// unique-person counting stay clean. Scope: only visitor/"online" numbers —
// money and challenge counts stay real.
//
// HOW IT GROWS WITHOUT REDEPLOYING: the numbers are computed from the CURRENT
// server time on every request (both / and /stats render dynamically), by
// interpolating the date anchors below. As real days pass, the output climbs on
// its own — one deploy is enough. You only redeploy to change the target curve.
//
// Turn it off: set env VISITOR_BOOST_UNTIL to a past date, or delete this file +
// the boostVisitorStats() call in lib/queries/stats.js.

const DEFAULT_UNTIL = "2026-09-30T23:59:59Z";
const BOOST_UNTIL = Date.parse(
  process.env.VISITOR_BOOST_UNTIL || DEFAULT_UNTIL
);

const D = (iso) => Date.parse(iso);

// [date, value] anchors, linearly interpolated between points (clamped outside).
// Cumulative all-time visitors — always climbing.
const SINCE_LAUNCH = [
  [D("2026-08-01"), 2500],
  [D("2026-08-24"), 8475],
  [D("2026-09-01"), 12500],
  [D("2026-09-15"), 21000],
  [D("2026-09-30"), 33000],
];
// "This month" for September only. August is the launch month, so its month
// total equals the since-launch total (handled below).
const MONTH_SEP = [
  [D("2026-09-01"), 300],
  [D("2026-09-15"), 3000],
  [D("2026-09-30"), 7500],
];
// Own "visitors today" curve (clamped so it never exceeds the month total).
const TODAY = [
  [D("2026-08-24"), 560],
  [D("2026-09-01"), 560],
  [D("2026-09-15"), 780],
  [D("2026-09-30"), 1050],
];
// Own "online now" baseline (capped at today's unique visitors).
const ONLINE = [
  [D("2026-08-24"), 150],
  [D("2026-09-30"), 210],
];

const UNIQUE_LAUNCH_RATIO = 0.51; // 8475 * 0.51 ≈ 4322
const UNIQUE_MONTH_RATIO = 0.55;
const UNIQUE_TODAY_RATIO = 0.62;

// Linear interpolation across [date, value] anchors; clamps before/after the ends.
function interp(anchors, t) {
  if (t <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    const [t1, v1] = anchors[i];
    if (t <= t1) {
      const [t0, v0] = anchors[i - 1];
      return v0 + ((t - t0) / (t1 - t0)) * (v1 - v0);
    }
  }
  return last[1];
}

// Deterministic pseudo-random in [0,1) (stable per 5-min bucket → no flicker).
function rand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function isBoostActive(now = Date.now()) {
  return Number.isFinite(BOOST_UNTIL) && now <= BOOST_UNTIL;
}

/** Overlay fake-but-plausible visitor numbers during the boost window only. */
export function boostVisitorStats(real, now = Date.now()) {
  if (!isBoostActive(now)) return real;

  const d = new Date(now);
  const isAugust2026 = d.getUTCFullYear() === 2026 && d.getUTCMonth() === 7;
  const hour = d.getUTCHours();

  const sinceLaunch = Math.round(interp(SINCE_LAUNCH, now));
  const uniqueSinceLaunch = Math.round(sinceLaunch * UNIQUE_LAUNCH_RATIO);

  // Launch month (Aug): month total == since-launch. Sept onward: its own curve.
  const monthVisitors = isAugust2026
    ? sinceLaunch
    : Math.round(interp(MONTH_SEP, now));
  const uniqueMonth = isAugust2026
    ? uniqueSinceLaunch
    : Math.round(monthVisitors * UNIQUE_MONTH_RATIO);

  // Today: own curve, mild intraday ramp, never above the month total.
  const intraday = 0.8 + 0.2 * Math.min(1, (hour + 1) / 24);
  const visitorsToday = Math.min(
    monthVisitors,
    Math.round(interp(TODAY, now) * intraday)
  );
  const uniqueToday = Math.round(visitorsToday * UNIQUE_TODAY_RATIO);

  // Online now: baseline with day/night + 5-min wobble, capped at today's uniques.
  const bucket = Math.floor(now / 300_000);
  const daynight =
    0.9 + 0.2 * (0.5 + 0.5 * Math.sin(((hour - 7) / 24) * Math.PI * 2));
  const wobble = 0.9 + 0.2 * rand(bucket);
  const online = Math.min(
    uniqueToday,
    Math.round(interp(ONLINE, now) * daynight * wobble)
  );

  const fake = {
    online,
    visitorsSinceLaunch: sinceLaunch,
    uniqueVisitorsSinceLaunch: uniqueSinceLaunch,
    visitorsThisMonth: monthVisitors,
    uniqueVisitorsThisMonth: uniqueMonth,
    visitorsToday,
    uniqueVisitorsToday: uniqueToday,
  };

  if (!real) return fake;
  // Real traffic stacks on top of the fake floor (display-only).
  const add = (k) => fake[k] + Math.max(0, Math.round(Number(real[k] ?? 0)));
  return {
    online: add("online"),
    visitorsSinceLaunch: add("visitorsSinceLaunch"),
    uniqueVisitorsSinceLaunch: add("uniqueVisitorsSinceLaunch"),
    visitorsThisMonth: add("visitorsThisMonth"),
    uniqueVisitorsThisMonth: add("uniqueVisitorsThisMonth"),
    visitorsToday: add("visitorsToday"),
    uniqueVisitorsToday: add("uniqueVisitorsToday"),
  };
}
