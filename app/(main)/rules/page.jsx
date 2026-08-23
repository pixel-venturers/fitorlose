import {
  CURRENCY,
  MAX_CHALLENGE_DAYS,
  MIN_CHALLENGE_DAYS,
  MIN_COMMITMENT_INR,
  MIN_COMMITMENT_USD,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";

import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata = {
  title: "Rules & Fairness",
  description:
    "How challenges, verification, payments, settlements and disputes work on FitOrLose. Full transparency, no fine print.",
};

export default function Page() {
  const SECTIONS = [
    {
      id: "eligibility",
      title: "Who can create a challenge",
      points: [
        "Any signed-in member can create a challenge.",
        "You must be old enough to enter a binding financial commitment in your jurisdiction.",
        "One person, one identity — duplicate or fraudulent accounts are removed.",
      ],
    },
    {
      id: "duration",
      title: "Challenge duration",
      points: [
        `Minimum duration is ${MIN_CHALLENGE_DAYS} days (one month).`,
        `Maximum duration is ${MAX_CHALLENGE_DAYS} days (one year).`,
        "The window is fixed when the challenge activates and cannot be shortened or lengthened.",
      ],
    },
    {
      id: "creation",
      title: "Creating a challenge",
      points: [
        "Goals must be specific and measurable — a target value, distance, duration, or frequency.",
        "Vague goals like \u201Cget in shape\u201D are not allowed.",
        `Minimum commitment is ${formatCurrency(MIN_COMMITMENT_INR, CURRENCY.INR)} in India or ${formatCurrency(MIN_COMMITMENT_USD, CURRENCY.USD)} otherwise.`,
        "A challenge only becomes active after payment is confirmed and the verification method is in place.",
      ],
    },
    {
      id: "verification",
      title: "Verification",
      points: [
        "Automatic: activity is verified from a connected fitness provider (e.g. Strava).",
        "Manual: you submit proof — photos, video, screenshots or documents — for admin review.",
        "Hybrid: fitness data supports the result but manual review still applies.",
        "Automatically verified challenges are still reviewed before any money moves.",
      ],
    },
    {
      id: "win-loss",
      title: "Win & loss conditions",
      points: [
        "There are only two outcomes: WON or LOST. There are no partial rewards.",
        "You win by meeting the full goal within the challenge window and passing verification.",
        "You lose if the goal isn't met, or verification fails after the review period.",
        "A challenge is never marked WON on your word alone — it requires verification and admin approval.",
      ],
    },
    {
      id: "payments",
      title: "Payments",
      points: [
        "Commitments are collected up front through a verified payment provider.",
      ],
    },
    {
      id: "settlement",
      title: "Rewards & settlement",
      points: [
        "When you win, your commitment is returned as a new reward transaction.",
        "Settlement happens after verification and admin approval.",
      ],
    },
    {
      id: "visibility",
      title: "Visibility",
      points: [
        "Public: your name will be shown on the leaderboard and challenge page.",
        "Anonymous: you appear on the leaderboard without your identity.",
        "Private: the challenge is not publicly discoverable — only you and admins can see it.",
        "Being on the public leaderboard never exposes your private challenge details.",
      ],
    },
    {
      id: "disputes",
      title: "Disputes",
      points: [
        "If you disagree with a verification result, you can open a dispute for admin review.",
        "Disputes are resolved using the recorded activity, submitted proof and verification history.",
        "Settlement is paused while a dispute is open.",
      ],
    },
    {
      id: "prohibited",
      title: "Prohibited challenges & conduct",
      points: [
        "No unsafe, harmful, or medically inadvisable goals.",
        "No goals that encourage disordered behaviour or extreme rapid weight loss.",
        "No illegal activity, and no challenges that can't be fairly verified.",
      ],
    },
    {
      id: "fraud",
      title: "Fraud & cheating",
      points: [
        "Manually faked activity, edited data, or borrowed devices are grounds for disqualification.",
        "Impossible metrics and duplicate activities across providers are flagged for review.",
        "Confirmed fraud forfeits the challenge and may result in account removal.",
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation",
      points: [
        "A challenge can be cancelled before it becomes active at no cost.",
        "Once active, a challenge runs to its outcome — commitments can't be withdrawn to dodge a loss.",
      ],
    },
    {
      id: "refunds",
      title: "Refunds",
      points: [
        "If a challenge never activates (for example, a failed setup), the commitment is refunded.",
        "Winning returns your commitment as a reward.",
      ],
    },
    {
      id: "privacy",
      title: "Privacy",
      points: [
        "We collect only the data needed to run a challenge and verify results.",
        "Fitness and health data is sensitive — access tokens never touch the browser and are protected server-side.",
        "You can disconnect a provider at any time; historical verification records remain for auditability.",
      ],
    },
  ];

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        eyebrow="Rules & fairness"
        title="Clear rules. No fine print."
        description="Money is involved, so everything here is written to be transparent and fair. If something isn't clear, it isn't fair — so we spell it out."
      />

      <div className="mt-14 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <nav
          className="mb-10 hidden lg:sticky lg:top-20 lg:mb-0 lg:block lg:self-start"
          aria-label="Rules sections"
        >
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            On this page
          </p>
          <ul className="mt-3 space-y-1.5">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-foreground block text-sm transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="text-muted-foreground flex gap-2.5 text-sm text-pretty"
                  >
                    <span
                      className="bg-primary/70 mt-2 size-1.5 shrink-0 rounded-full"
                      aria-hidden
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
