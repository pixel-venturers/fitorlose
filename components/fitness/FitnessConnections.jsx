"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DisconnectFitnessProvider,
  StartFitnessConnection,
  SyncFitnessActivities,
} from "@/actions/Fitness";
import {
  Activity,
  Apple,
  Check,
  HeartPulse,
  Plus,
  RefreshCw,
  Smartphone,
  Watch,
} from "lucide-react";
import { toast } from "sonner";

import { formatDateTime } from "@/lib/formatters";

import { Button } from "@/components/ui/button";

const ICONS = { Activity, Watch, Apple, HeartPulse, Smartphone };

export function FitnessConnections({ providers, flash }) {
  const router = useRouter();
  const [acting, setActing] = useState(null);

  // Surface the OAuth callback result once, on mount.
  useEffect(() => {
    if (flash?.connected) {
      toast.success("Account connected — your activities are syncing.");
    } else if (flash?.error) {
      toast.error(
        flash.error === "denied"
          ? "Connection cancelled."
          : "Could not connect. Please try again."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(slug, fn, onOk) {
    setActing(slug);
    try {
      const res = await fn({ provider: slug });
      if (res?.ok) onOk(res.data);
      else toast.error(res?.error?.message ?? "Something went wrong.");
    } finally {
      setActing(null);
    }
  }

  const connect = (slug) =>
    run(slug, StartFitnessConnection, (data) => {
      if (data?.url) window.location.assign(data.url);
    });

  const disconnect = (slug) =>
    run(slug, DisconnectFitnessProvider, () => {
      toast.success("Disconnected.");
      router.refresh();
    });

  const sync = (slug) =>
    run(slug, SyncFitnessActivities, (data) => {
      const n = data?.imported ?? 0;
      toast.success(
        `Synced ${n} ${n === 1 ? "activity" : "activities"}` +
          (data?.flagged ? ` · ${data.flagged} flagged for review` : "")
      );
      router.refresh();
    });

  return (
    <ul className="divide-border/60 bg-card ring-foreground/10 divide-y overflow-hidden rounded-xl ring-1">
      {providers.map((provider) => {
        const ProviderIcon = ICONS[provider.icon] ?? Activity;
        const isBusy = acting === provider.slug;
        return (
          <li
            key={provider.slug}
            className="flex items-center gap-4 px-4 py-4 sm:px-5"
          >
            <div className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg">
              <ProviderIcon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{provider.label}</p>
                {provider.connected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    <Check className="size-3" />
                    Connected
                  </span>
                ) : null}
                {!provider.enabled ? (
                  <span className="text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5 text-xs font-medium">
                    {provider.connectVia === "native"
                      ? "Mobile app"
                      : "Coming soon"}
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {provider.connected && provider.lastSyncedAt
                  ? `Last synced ${formatDateTime(provider.lastSyncedAt)}`
                  : provider.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {provider.enabled && provider.connected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => sync(provider.slug)}
                  >
                    <RefreshCw className={isBusy ? "animate-spin" : ""} />
                    Sync
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => disconnect(provider.slug)}
                  >
                    Disconnect
                  </Button>
                </>
              ) : provider.enabled ? (
                <Button
                  size="sm"
                  disabled={isBusy}
                  onClick={() => connect(provider.slug)}
                >
                  <Plus />
                  Connect
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Connect
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
