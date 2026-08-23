/**
 * Fitness challenge categories.
 * `icon` is a lucide-react icon name resolved by the CategoryIcon component.
 * Gradients stay within a cool blue-oriented palette to match the dark theme.
 */
import { ACTIVITY_TYPE, VERIFICATION_TYPE } from "@/lib/constants";

// Per-category cover images live at public/covers/<slug>.jpg. Cards/pages fall
// back to the category gradient when the file is missing or a challenge has none.
export const CHALLENGE_CATEGORIES = [
  {
    slug: "weight-loss",
    key: "WEIGHT_LOSS",
    label: "Weight Loss",
    icon: "Scale",
    activityType: ACTIVITY_TYPE.OTHER,
    metric: "weight",
    unit: "kg",
    defaultVerification: VERIFICATION_TYPE.MANUAL,
    gradient: "from-sky-500/25 via-blue-600/10 to-indigo-600/25",
    accent: "text-sky-300",
    tagline: "Set a target. Weigh in. Get it back.",
    description:
      "Commit to a measurable weight-loss target and verify your result with progress photos and weigh-ins.",
    example: "Lose 5 kg in 90 days",
    ctaLabel: "Challenge me to lose weight",
    coverImage: "/covers/weight-loss.jpg",
  },
  {
    slug: "running",
    key: "RUNNING",
    label: "Running",
    icon: "Footprints",
    activityType: ACTIVITY_TYPE.RUN,
    metric: "distance",
    unit: "km",
    defaultVerification: VERIFICATION_TYPE.AUTOMATIC,
    gradient: "from-blue-500/25 via-cyan-500/10 to-sky-600/25",
    accent: "text-blue-300",
    tagline: "Every run, verified automatically.",
    description:
      "Run a distance or a daily duration. Connect Strava or another provider and your runs verify themselves.",
    example: "Run 45 minutes daily for 60 days",
    ctaLabel: "Challenge me to start running",
    coverImage: "/covers/running.jpg",
  },
  {
    slug: "cycling",
    key: "CYCLING",
    label: "Cycling",
    icon: "Bike",
    activityType: ACTIVITY_TYPE.CYCLE,
    metric: "distance",
    unit: "km",
    defaultVerification: VERIFICATION_TYPE.AUTOMATIC,
    gradient: "from-indigo-500/25 via-blue-500/10 to-violet-600/25",
    accent: "text-indigo-300",
    tagline: "Rack up the kilometres.",
    description:
      "Ride a cumulative distance or a recurring duration, automatically verified from your connected device.",
    example: "Cycle 500 km within 90 days",
    ctaLabel: "Challenge me to ride further",
    coverImage: "/covers/cycling.jpg",
  },
  {
    slug: "swimming",
    key: "SWIMMING",
    label: "Swimming",
    icon: "Waves",
    activityType: ACTIVITY_TYPE.SWIM,
    metric: "distance",
    unit: "km",
    defaultVerification: VERIFICATION_TYPE.AUTOMATIC,
    gradient: "from-cyan-500/25 via-sky-500/10 to-blue-600/25",
    accent: "text-cyan-300",
    tagline: "Lengths add up.",
    description:
      "Swim a total distance or a recurring session length, verified from supported wearables.",
    example: "Swim 30 minutes daily for 30 days",
    ctaLabel: "Challenge me to swim more",
    coverImage: "/covers/swimming.jpg",
  },
  {
    slug: "walking",
    key: "WALKING",
    label: "Walking",
    icon: "PersonStanding",
    activityType: ACTIVITY_TYPE.WALK,
    metric: "steps",
    unit: "steps",
    defaultVerification: VERIFICATION_TYPE.AUTOMATIC,
    gradient: "from-sky-500/25 via-blue-500/10 to-cyan-600/25",
    accent: "text-sky-300",
    tagline: "10,000 steps, every single day.",
    description:
      "Hit a daily step target, automatically verified from your phone or watch.",
    example: "Walk 10,000 steps for 60 days",
    ctaLabel: "Challenge me to get better",
    coverImage: "/covers/walking.jpg",
  },
  {
    slug: "gym",
    key: "GYM",
    label: "Gym & Workout",
    icon: "Dumbbell",
    activityType: ACTIVITY_TYPE.WORKOUT,
    metric: "duration",
    unit: "min",
    defaultVerification: VERIFICATION_TYPE.AUTOMATIC,
    gradient: "from-violet-500/25 via-indigo-500/10 to-blue-600/25",
    accent: "text-violet-300",
    tagline: "Show up. Put in the minutes.",
    description:
      "Complete a daily workout duration or weekly frequency, verified from your fitness app.",
    example: "Work out 45 minutes daily for 30 days",
    ctaLabel: "Challenge me to be in better shape",
    coverImage: "/covers/gym.jpg",
  },
  {
    slug: "strength",
    key: "STRENGTH",
    label: "Strength",
    icon: "Activity",
    activityType: ACTIVITY_TYPE.STRENGTH,
    metric: "frequency",
    unit: "sessions",
    defaultVerification: VERIFICATION_TYPE.HYBRID,
    gradient: "from-blue-600/25 via-indigo-500/10 to-violet-600/25",
    accent: "text-indigo-300",
    tagline: "Get stronger on a schedule.",
    description:
      "Train a set number of sessions per week. Fitness data plus manual proof keeps it honest.",
    example: "Strength train 4x per week for 12 weeks",
    ctaLabel: "Challenge me to get stronger",
    coverImage: "/covers/strength.jpg",
  },
];

export const CATEGORY_BY_SLUG = Object.fromEntries(
  CHALLENGE_CATEGORIES.map((category) => [category.slug, category])
);

export function getCategory(slug) {
  return CATEGORY_BY_SLUG[slug];
}
