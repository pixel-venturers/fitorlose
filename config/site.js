/**
 * Site-wide metadata and navigation configuration.
 */

export const SITE = {
  name: "FitOrLose",
  tagline: "Put commitment behind your fitness goal.",
  description:
    "FitOrLose is a fitness commitment platform. Put real money behind a measurable fitness goal — complete it and win, fail and lose your commitment.",
  url: "https://fitorlose.lol",
  ogImage: "/og.png",
  supportEmail: "contact@fitorlose.lol",
};

// The studio that builds & maintains FitOrLose (subtle credit in the footer).
export const AGENCY = {
  name: "PixelVentures",
  url: "https://pixelventures.dev",
};

// Primary header navigation (order matters).
export const MAIN_NAV = [
  { label: "Leaderboard", href: "/" },
  { label: "Challenges Won", href: "/challenges-won" },
  { label: "About", href: "/about" },
  { label: "Rules", href: "/rules" },
];

// Footer link groups.
export const FOOTER_NAV = [
  {
    title: "Product",
    links: [
      { label: "Leaderboard", href: "/" },
      { label: "Challenges Won", href: "/challenges-won" },
      { label: "Create a Challenge", href: "/create" },
      { label: "Fitness Challenges", href: "/fitness-challenges" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Rules", href: "/rules" },
      { label: "Stats", href: "/stats" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Rules & Fairness", href: "/rules" },
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Refunds", href: "/refund-policy" },
      { label: "Terms", href: "/terms-and-conditions" },
    ],
  },
];

// Where the primary CTAs point.
export const ROUTES = {
  home: "/",
  challengesWon: "/challenges-won",
  about: "/about",
  rules: "/rules",
  create: "/create",
  dashboard: "/dashboard",
  connections: "/settings/connections",
  stats: "/stats",
  admin: "/admin",
  fitnessChallenges: "/fitness-challenges",
  signIn: "/sign-in",
  signUp: "/sign-up",
};
