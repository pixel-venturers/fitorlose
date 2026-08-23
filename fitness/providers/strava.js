// Strava provider. Implements the FitnessProvider contract over Strava's OAuth2
// + REST API using fetch (no SDK needed). Server-only: the client id/secret and
// user tokens must never reach the browser.
import "server-only";

import { redirectUri } from "@/fitness/fitness-utils";

import { ACTIVITY_SOURCE, ACTIVITY_TYPE } from "@/lib/constants";

const AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const TOKEN_URL = "https://www.strava.com/oauth/token";
const ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

// Strava sport_type / type → our normalized ACTIVITY_TYPE.
const TYPE_MAP = {
  Run: ACTIVITY_TYPE.RUN,
  TrailRun: ACTIVITY_TYPE.RUN,
  VirtualRun: ACTIVITY_TYPE.RUN,
  Walk: ACTIVITY_TYPE.WALK,
  Hike: ACTIVITY_TYPE.WALK,
  Ride: ACTIVITY_TYPE.CYCLE,
  VirtualRide: ACTIVITY_TYPE.CYCLE,
  EBikeRide: ACTIVITY_TYPE.CYCLE,
  MountainBikeRide: ACTIVITY_TYPE.CYCLE,
  GravelRide: ACTIVITY_TYPE.CYCLE,
  Swim: ACTIVITY_TYPE.SWIM,
  WeightTraining: ACTIVITY_TYPE.STRENGTH,
  Workout: ACTIVITY_TYPE.WORKOUT,
  Crossfit: ACTIVITY_TYPE.WORKOUT,
  HighIntensityIntervalTraining: ACTIVITY_TYPE.WORKOUT,
};

function mapActivityType(raw) {
  return (
    TYPE_MAP[raw?.sport_type] ?? TYPE_MAP[raw?.type] ?? ACTIVITY_TYPE.OTHER
  );
}

function credentials() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

async function postToken(params) {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      ...params,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Strava token request failed (${res.status}): ${text.slice(0, 200)}`
    );
  }
  return res.json();
}

function normalizeTokenResponse(json) {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // Strava returns expires_at as unix seconds.
    expiresAt: json.expires_at ? new Date(json.expires_at * 1000) : null,
    providerUserId: json.athlete?.id != null ? String(json.athlete.id) : null,
    athlete: json.athlete
      ? {
          id: json.athlete.id,
          firstname: json.athlete.firstname ?? null,
          lastname: json.athlete.lastname ?? null,
        }
      : null,
  };
}

export const stravaProvider = {
  key: "STRAVA",
  slug: "strava",

  /** Build the consent URL the user is redirected to. */
  authorizeUrl({ state, scopes }) {
    const { clientId } = credentials();
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri("strava"),
      approval_prompt: "auto",
      scope: scopes || "read,activity:read_all",
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  /** Exchange an authorization code for tokens + athlete identity. */
  async exchangeCode(code) {
    const json = await postToken({ code, grant_type: "authorization_code" });
    return normalizeTokenResponse(json);
  },

  /** Refresh an expired access token. */
  async refreshTokens(refreshToken) {
    const json = await postToken({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    return normalizeTokenResponse(json);
  },

  /** Fetch raw activities newer than `afterEpoch` (unix seconds). */
  async fetchActivities({
    accessToken,
    afterEpoch = null,
    perPage = 100,
    page = 1,
  }) {
    const params = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
    });
    if (afterEpoch) params.set("after", String(afterEpoch));
    const res = await fetch(`${ACTIVITIES_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Strava activities fetch failed (${res.status}): ${text.slice(0, 200)}`
      );
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  /** Map a raw Strava activity onto the normalized shape. */
  normalize(raw) {
    const startedAt = raw?.start_date ? new Date(raw.start_date) : null;
    const elapsed = Number(raw?.elapsed_time) || null;
    const endedAt =
      startedAt && elapsed
        ? new Date(startedAt.getTime() + elapsed * 1000)
        : null;
    return {
      externalActivityId: raw?.id != null ? String(raw.id) : null,
      activityType: mapActivityType(raw),
      startedAt,
      endedAt,
      durationSeconds: Number(raw?.moving_time) || elapsed,
      distanceMeters: raw?.distance != null ? Number(raw.distance) : null,
      steps: null,
      calories: raw?.calories != null ? Math.round(Number(raw.calories)) : null,
      source: raw?.device_name ?? null,
      sourceKind: raw?.manual
        ? ACTIVITY_SOURCE.MANUALLY_ENTERED
        : ACTIVITY_SOURCE.DEVICE_RECORDED,
      raw: {
        id: raw?.id,
        name: raw?.name,
        type: raw?.type,
        sport_type: raw?.sport_type,
        distance: raw?.distance,
        moving_time: raw?.moving_time,
        elapsed_time: raw?.elapsed_time,
        start_date: raw?.start_date,
        manual: raw?.manual,
        average_speed: raw?.average_speed,
        max_speed: raw?.max_speed,
      },
    };
  },
};
