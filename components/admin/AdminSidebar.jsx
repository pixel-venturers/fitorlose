"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CircleDollarSign,
  HandCoins,
  Inbox,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Submissions", href: "/admin/submissions", icon: Inbox },
  { label: "Challenges", href: "/admin/challenges", icon: Activity },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Transactions", href: "/admin/transactions", icon: CircleDollarSign },
  { label: "Disputes", href: "/admin/disputes", icon: ShieldAlert },
  { label: "Settlements", href: "/admin/settlements", icon: HandCoins },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Admin">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
