"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, ROUTES } from "@/config/site";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, Menu } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border/60 bg-background sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-0.5 md:flex">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, item.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href={ROUTES.create}>
              Challenge Myself
              <ArrowRight />
            </Link>
          </Button>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="hidden md:inline-flex"
            >
              <Link href={ROUTES.dashboard}>Dashboard</Link>
            </Button>
            <UserButton />
          </Show>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-border/60 border-b">
                <SheetTitle asChild>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {MAIN_NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(pathname, item.href)
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="border-border/60 mt-auto flex flex-col gap-2 border-t p-4">
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full">
                    <Link href={ROUTES.create}>
                      Challenge Myself
                      <ArrowRight />
                    </Link>
                  </Button>
                </SheetClose>
                <Show when="signed-in">
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Link href={ROUTES.dashboard}>Dashboard</Link>
                    </Button>
                  </SheetClose>
                </Show>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
