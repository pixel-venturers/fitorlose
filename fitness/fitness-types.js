// Normalized fitness events + the shape every provider must emit. Providers map
// their own payloads onto this so the verification engine never sees a
// provider-specific field.

export const FITNESS_EVENT = {
  ACTIVITY_CREATED: "activity.created",
  ACTIVITY_UPDATED: "activity.updated",
  ACTIVITY_DELETED: "activity.deleted",
};

/**
 * @typedef {Object} NormalizedActivity
 * @property {string} externalActivityId  Provider's stable activity id (dedup key).
 * @property {string} activityType        ACTIVITY_TYPE enum value.
 * @property {Date}   startedAt
 * @property {Date|null} endedAt
 * @property {number|null} durationSeconds
 * @property {number|null} distanceMeters
 * @property {number|null} steps
 * @property {number|null} calories
 * @property {string|null} source         Device/app name, if known.
 * @property {string} sourceKind          ACTIVITY_SOURCE enum value.
 * @property {object}  raw                 Minimal raw payload for audit.
 */
