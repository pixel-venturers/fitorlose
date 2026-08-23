import { formatCurrency } from "@/lib/formatters";

/**
 * Builds the share blurb for a challenge (without the URL — the URL is appended
 * per-platform by ShareButton). Uses a different template for your own goal vs
 * someone else's.
 */
export function buildChallengeShareMessage({
  own,
  amount,
  currency,
  name,
  goal,
  durationDays,
}) {
  const money = formatCurrency(amount, currency);
  if (own) {
    return `I just put ${money} behind my fitness goal.\n\n🎯 Goal: ${goal}\n⏳ Time: ${durationDays} days\n💰 Money on the line: ${money}\n\nNow I have to deliver.\n\n`;
  }
  return `${money}.\nOne fitness goal.\nOne chance to prove it.\n\n${name} is taking on: ${goal}\n\nWould you do the same?\n\n`;
}
