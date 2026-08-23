"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";

export default function ErrorBoundary({ reset }) {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold text-primary">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
        We hit an unexpected error
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-pretty text-muted-foreground">
        This one's on us. You can try again, or head back to the leaderboard.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={() => reset()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </Container>
  );
}
