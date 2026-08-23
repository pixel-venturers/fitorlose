import {
  Activity,
  Share2,
  ShieldCheck,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";

import { GlowCard } from "@/components/common/GlowCard";
import { SectionHeading } from "@/components/common/SectionHeading";

const STEPS = [
  {
    icon: Target,
    title: "Create a challenge",
    text: "Pick a measurable goal — run 45 minutes daily, lose 5 kg, walk 10,000 steps.",
  },
  {
    icon: Wallet,
    title: "Commit your money",
    text: "Put real money on the line. The bigger the stake, the stronger the motivation.",
  },
  {
    icon: Activity,
    title: "Do the work",
    text: "Connect a fitness account and activity verifies automatically. No daily check-ins.",
  },
  {
    icon: ShieldCheck,
    title: "Get verified",
    text: "Fitness data or submitted proof is reviewed before any result is settled.",
  },
  {
    icon: Trophy,
    title: "Win or lose",
    text: "Hit your goal and get your commitment back. Fall short and you lose it.",
  },
  {
    icon: Share2,
    title: "Share the result",
    text: "Post your win, challenge a friend, and start your next commitment.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="From commitment to result in six steps"
        description="Simple, transparent, and built so the outcome is never in doubt."
        align="center"
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <GlowCard key={step.title}>
            <div className="relative p-5">
              <span className="text-foreground/[0.06] absolute top-3 right-4 text-5xl font-bold tabular-nums">
                {index + 1}
              </span>
              <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-lg">
                <step.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-medium">{step.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm">
                {step.text}
              </p>
            </div>
          </GlowCard>
        ))}
      </div>
    </section>
  );
}
