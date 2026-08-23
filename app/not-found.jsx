import Link from "next/link";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-8 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
        This page went off track
      </h1>
      <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
        The page you're looking for doesn't exist or may have moved. Let's get you back to the
        leaderboard.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <Home />
          Back to leaderboard
        </Link>
      </Button>
    </div>
  );
}
