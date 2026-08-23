// Fitbit provider. Implements the FitnessProvider contract over Fitbit's OAuth2
// (Authorization Code Grant, HTTP Basic token auth) + Web API using fetch.
// Server-only: client id/secret and user tokens must never reach the browser.
// Unlike Strava, Fitbit reports step counts, so step-based goals can verify.
import "server-only";

import { redirectUri } from "@/fitness/fitness-utils";

import { ACTIVITY_SOURCE, ACTIVITY_TYPE } from "@/lib/constants";

const AUTHORIZE_URL = "https://www.fitbit.com/oauth2/authorize";
const TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const ACTIVITIES_URL = "https://api.fitbit.com/1/user/-/activities/list.json";

function mapActivityType(raw) {
  const name = String(raw?.activityName ?? "").toLowerCase();
  if (name.includes("run") || name.includes("treadmill"))
    return ACTIVITY_TYPE.RUN;
  if (name.includes("hike")) return ACTIVITY_TYPE.WALK;
  if (name.includes("walk")) return ACTIVITY_TYPE.WALK;
  if (name.includes("bike") || name.includes("cycl") || name.includes("spin"))
    return ACTIVITY_TYPE.CYCLE;
  if (name.includes("swim")) return ACTIVITY_TYPE.SWIM;
  if (name.includes("weight") || name.includes("strength"))
    return ACTIVITY_TYPE.STRENGTH;
  if (
    name.includes("workout") ||
    name.includes("sport") ||
    name.includes("bootcamp") ||
    name.includes("circuit") ||
    name.includes("interval") ||
    name.includes("elliptical") ||
    name.includes("aerobic") ||
    name.includes("training")
  ) {
    return ACTIVITY_TYPE.WORKOUT;
  }
  return ACTIVITY_TYPE.OTHER;
}

// Fitbit renders times in the resource owner's local time; we request UTC and
// default any offset-less value to UTC so day-bucketing stays deterministic.
function parseFitbitTime(value) {
  if (!value) return null;
  const hasTz = /[zZ]$|[+-]\d\d:?\d\d$/.test(value);
  return new Date(hasTz ? value : `${value}Z`);
}

function credentials() {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FITBIT_CLIENT_ID / FITBIT_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

async function postToken(params) {
  const { clientId, clientSecret } = credentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Fitbit token request failed (${res.status}): ${text.slice(0, 200)}`
    );
  }
  return res.json();
}

function normalizeTokenResponse(json) {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // Fitbit returns expires_in (seconds) rather than an absolute timestamp.
    expiresAt: json.expires_in
      ? new Date(Date.now() + Number(json.expires_in) * 1000)
      : null,
    providerUserId: json.user_id != null ? String(json.user_id) : null,
    scopes: json.scope ?? null,
  };
}

export const fitbitProvider = {
  key: "FITBIT",
  slug: "fitbit",

  authorizeUrl({ state, scopes }) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri("fitbit"),
      // Fitbit scopes are space-separated.
      scope: (scopes || "activity").replace(/,/g, " "),
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCode(code) {
    const json = await postToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri("fitbit"),
    });
    return normalizeTokenResponse(json);
  },

  async refreshTokens(refreshToken) {
    const json = await postToken({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    return normalizeTokenResponse(json);
  },

  async fetchActivities({ accessToken, afterEpoch = null, limit = 100 }) {
    const afterMs = afterEpoch
      ? afterEpoch * 1000
      : Date.now() - 30 * 86_400_000;
    const afterDate = new Date(afterMs).toISOString().slice(0, 10);
    const params = new URLSearchParams({
      afterDate,
      sort: "asc",
      offset: "0",
      limit: String(limit),
      timezone: "UTC",
    });
    // No Accept-Language header → metric units (distance in km).
    const res = await fetch(`${ACTIVITIES_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Fitbit activities fetch failed (${res.status}): ${text.slice(0, 200)}`
      );
    }
    const data = await res.json();
    return Array.isArray(data?.activities) ? data.activities : [];
  },

  normalize(raw) {
    const startedAt = parseFitbitTime(raw?.startTime);
    const durationMs = Number(raw?.activeDuration ?? raw?.duration) || null;
    const endedAt =
      startedAt && durationMs
        ? new Date(startedAt.getTime() + durationMs)
        : null;
    const distanceKm = raw?.distance != null ? Number(raw.distance) : null;
    return {
      externalActivityId: raw?.logId != null ? String(raw.logId) : null,
      activityType: mapActivityType(raw),
      startedAt,
      endedAt,
      durationSeconds: durationMs ? Math.round(durationMs / 1000) : null,
      distanceMeters: distanceKm != null ? Math.round(distanceKm * 1000) : null,
      steps: raw?.steps != null ? Number(raw.steps) : null,
      calories: raw?.calories != null ? Math.round(Number(raw.calories)) : null,
      source: raw?.source?.name ?? raw?.logType ?? null,
      sourceKind:
        raw?.logType === "manual"
          ? ACTIVITY_SOURCE.MANUALLY_ENTERED
          : ACTIVITY_SOURCE.DEVICE_RECORDED,
      raw: {
        logId: raw?.logId,
        activityName: raw?.activityName,
        activityTypeId: raw?.activityTypeId,
        startTime: raw?.startTime,
        duration: raw?.duration,
        activeDuration: raw?.activeDuration,
        distance: raw?.distance,
        steps: raw?.steps,
        calories: raw?.calories,
        logType: raw?.logType,
      },
    };
  },
};
