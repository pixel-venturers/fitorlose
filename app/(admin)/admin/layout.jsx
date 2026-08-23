import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Logo } from "@/components/Logo";

export default async function Layout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-full">
      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium">
              Admin
            </span>
          </div>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to site
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[210px_1fr]">
        <aside className="mb-6 lg:sticky lg:top-20 lg:mb-0 lg:self-start">
          <AdminSidebar />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
