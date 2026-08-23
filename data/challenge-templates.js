/**
 * Predefined challenge templates used to seed the create flow and SEO pages.
 * Amounts are whole integer major units (INR).
 */
import { VERIFICATION_TYPE } from "@/lib/constants";

export const CHALLENGE_TEMPLATES = [
  {
    id: "tpl-lose-5kg",
    categorySlug: "weight-loss",
    title: "Lose 5 kg",
    goalLabel: "Lose 5 kg",
    suggestedDays: 90,
    suggestedAmountInr: 10000,
    verification: VERIFICATION_TYPE.MANUAL,
    description: "A realistic, sustainable target. Verify with weigh-ins and progress photos.",
  },
  {
    id: "tpl-lose-10kg",
    categorySlug: "weight-loss",
    title: "Lose 10 kg",
    goalLabel: "Lose 10 kg",
    suggestedDays: 180,
    suggestedAmountInr: 20000,
    verification: VERIFICATION_TYPE.MANUAL,
    description: "A serious transformation over six months.",
  },
  {
    id: "tpl-run-daily-45",
    categorySlug: "running",
    title: "Run 45 minutes daily",
    goalLabel: "Run 45 min every day",
    suggestedDays: 60,
    suggestedAmountInr: 8000,
    verification: VERIFICATION_TYPE.AUTOMATIC,
    description: "Build the habit. Every run verifies automatically from Strava.",
  },
  {
    id: "tpl-run-100km",
    categorySlug: "running",
    title: "Run 100 km",
    goalLabel: "Run 100 km total",
    suggestedDays: 60,
    suggestedAmountInr: 7500,
    verification: VERIFICATION_TYPE.AUTOMATIC,
    description: "A cumulative distance goal at your own pace.",
  },
  {
    id: "tpl-cycle-500km",
    categorySlug: "cycling",
    title: "Cycle 500 km",
    goalLabel: "Cycle 500 km total",
    suggestedDays: 90,
    suggestedAmountInr: 9000,
    verification: VERIFICATION_TYPE.AUTOMATIC,
    description: "Long-haul distance goal for riders.",
  },
  {
    id: "tpl-swim-30-daily",
    categorySlug: "swimming",
    title: "Swim 30 minutes daily",
    goalLabel: "Swim 30 min every day",
    suggestedDays: 30,
    suggestedAmountInr: 6000,
    verification: VERIFICATION_TYPE.AUTOMATIC,
    description: "A focused month in the pool.",
  },
  {
    id: "tpl-walk-10k",
    categorySlug: "walking",
    title: "Walk 10,000 steps daily",
    goalLabel: "10,000 steps every day",
    suggestedDays: 60,
    suggestedAmountInr: 5000,
    verification: VERIFICATION_TYPE.AUTOMATIC,
    description: "The classic daily target, verified from your phone or watch.",
  },
  {
    id: "tpl-gym-45-daily",
    categorySlug: "gym",
    title: "Work out 45 minutes daily",
    goalLabel: "45 min workout every day",
    suggestedDays: 30,
    suggestedAmountInr: 6000,
    verification: VERIFICATION_TYPE.AUTOMATIC,
    description: "No missed days. Put the minutes in.",
  },
  {
    id: "tpl-strength-4x",
    categorySlug: "strength",
    title: "Strength train 4x per week",
    goalLabel: "4 sessions per week",
    suggestedDays: 84,
    suggestedAmountInr: 8000,
    verification: VERIFICATION_TYPE.HYBRID,
    description: "Consistency over twelve weeks.",
  },
];

export function getTemplatesForCategory(categorySlug) {
  return CHALLENGE_TEMPLATES.filter((template) => template.categorySlug === categorySlug);
}
