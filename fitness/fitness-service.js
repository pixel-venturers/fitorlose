// Thin fitness abstraction. Business code talks to `fitnessService`, never to a
// provider directly (PLAN.md rule) — mirrors the payment abstraction. Only
// Strava is wired today; the registry keeps new providers a drop-in addition.
import { fitbitProvider } from "@/fitness/providers/fitbit";
import { stravaProvider } from "@/fitness/providers/strava";

import {
  DB_PROVIDER_BY_SLUG,
  PROVIDER_META,
  SLUG_BY_DB_PROVIDER,
} from "@/lib/constants";

const PROVIDERS = {
  [stravaProvider.slug]: stravaProvider,
  [fitbitProvider.slug]: fitbitProvider,
};

// Accept either an app slug ("strava") or a DB enum key ("STRAVA").
function resolveSlug(ref) {
  if (!ref) return null;
  if (PROVIDERS[ref]) return ref;
  const fromDb = SLUG_BY_DB_PROVIDER[ref];
  return fromDb ?? null;
}

function getProvider(ref) {
  const slug = resolveSlug(ref);
  const provider = slug ? PROVIDERS[slug] : null;
  if (!provider) throw new Error(`Unsupported fitness provider: ${ref}`);
  return provider;
}

export const fitnessService = {
  /** True when the provider is enabled, web-connectable and implemented. */
  isSupported(ref) {
    const slug = resolveSlug(ref);
    const meta = slug ? PROVIDER_META[slug] : null;
    return Boolean(
      meta?.enabled && meta.connectVia === "web_oauth" && PROVIDERS[slug]
    );
  },

  dbKey(ref) {
    const slug = resolveSlug(ref);
    return slug ? DB_PROVIDER_BY_SLUG[slug] : null;
  },

  scopes(ref) {
    const slug = resolveSlug(ref);
    return slug ? (PROVIDER_META[slug]?.scopes ?? null) : null;
  },

  authorizeUrl(ref, args) {
    return getProvider(ref).authorizeUrl(args);
  },
  exchangeCode(ref, code) {
    return getProvider(ref).exchangeCode(code);
  },
  refreshTokens(ref, refreshToken) {
    return getProvider(ref).refreshTokens(refreshToken);
  },
  fetchActivities(ref, args) {
    return getProvider(ref).fetchActivities(args);
  },
  normalize(ref, raw) {
    return getProvider(ref).normalize(raw);
  },
};
