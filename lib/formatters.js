/**
 * Display formatters for currency, numbers, dates and time.
 *
 * NOTE (Phase 1): dates/times are formatted in UTC so server and client render
 * identically (no hydration mismatch) and the displayed calendar date matches the
 * stored value. Phase 2+ (DB) will convert UTC timestamps to the user's local
 * timezone per PLAN.md. Money is handled as whole integer major units (₹/$),
 * so no floating-point arithmetic is used.
 */
import { CURRENCY } from "@/lib/constants";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format money like ₹8,42,500 (INR, Indian grouping) or $10,000 (USD). */
export function formatCurrency(amount, currency = CURRENCY.INR) {
  const locale = currency === CURRENCY.USD ? "en-US" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

/** Plain grouped number: 84,391. */
export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

/** Compact number: 84,391 -> 84.4K, 12,482 -> 12.5K. */
export function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

/** Format a date as "15 Aug, 2026". */
export function formatDate(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

/** Format a time as "10:00 AM". */
export function formatTime(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  let hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

/** Combined "15 Aug, 2026 · 10:00 AM". */
export function formatDateTime(input) {
  return `${formatDate(input)} · ${formatTime(input)}`;
}

/** "70%" from a 0–100 number. */
export function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

/** Simple pluralization helper: pluralize(1, "day") -> "1 day". */
export function pluralize(count, singular, plural) {
  const n = Number(count) || 0;
  return `${formatNumber(n)} ${n === 1 ? singular : plural ?? `${singular}s`}`;
}
