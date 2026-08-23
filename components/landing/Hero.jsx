import Link from "next/link";
import { ROUTES } from "@/config/site";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { LiveActivityTicker } from "@/components/landing/LiveActivityTicker";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";

export function Hero({ stats, activity }) {
  return (
    <section className="border-border/60 relative overflow-hidden border-b">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-40" />
      <div className="bg-primary/20 pointer-events-none absolute -top-48 left-1/2 size-[42rem] -translate-x-1/2 rounded-full blur-3xl" />

      <Container className="relative pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <LiveActivityTicker items={activity} />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Put money behind your{" "}
            <span className="text-primary">fitness goal.</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base text-pretty sm:text-lg">
            Commit real money to a measurable goal. Complete it and win it back.
            Fall short and you lose it. No excuses — just results.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6 text-base">
              <Link href={ROUTES.create}>
                Challenge Myself Now
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6 text-base">
              <Link href={ROUTES.about}>How it works</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <LiveStatsBar stats={stats} />
        </div>
      </Container>
    </section>
  );
}
