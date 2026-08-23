// FitOrLose database seed.
// Run: `npm run db:seed` (loads .env.local via node --env-file).
// Idempotent: truncates all tables, then inserts a representative dataset that
// mirrors the Phase 1 UI so the app has realistic data to read in Phase 3.
import crypto from "node:crypto";
import pg from "pg";

import { connectDatabase, db } from "./db.js";

const uuid = () => crypto.randomUUID();
const NOW = new Date("2026-08-22T12:00:00Z");
const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260822);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const TABLES = [
  "activity",
  "auditLog",
  "challenge",
  "challengeCategory",
  "challengeStatusHistory",
  "connectedAccount",
  "dispute",
  "fitnessProvider",
  "payment",
  "settlement",
  "submission",
  "transaction",
  "user",
];

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------
const CATEGORIES = [
  {
    slug: "weight-loss",
    label: "Weight Loss",
    activityType: "OTHER",
    defaultVerification: "MANUAL",
    unit: "kg",
    sortOrder: 1,
  },
  {
    slug: "running",
    label: "Running",
    activityType: "RUN",
    defaultVerification: "AUTOMATIC",
    unit: "km",
    sortOrder: 2,
  },
  {
    slug: "cycling",
    label: "Cycling",
    activityType: "CYCLE",
    defaultVerification: "AUTOMATIC",
    unit: "km",
    sortOrder: 3,
  },
  {
    slug: "swimming",
    label: "Swimming",
    activityType: "SWIM",
    defaultVerification: "AUTOMATIC",
    unit: "km",
    sortOrder: 4,
  },
  {
    slug: "walking",
    label: "Walking",
    activityType: "WALK",
    defaultVerification: "AUTOMATIC",
    unit: "steps",
    sortOrder: 5,
  },
  {
    slug: "gym",
    label: "Gym & Workout",
    activityType: "WORKOUT",
    defaultVerification: "AUTOMATIC",
    unit: "min",
    sortOrder: 6,
  },
  {
    slug: "strength",
    label: "Strength",
    activityType: "STRENGTH",
    defaultVerification: "HYBRID",
    unit: "sessions",
    sortOrder: 7,
  },
];

const PROVIDERS = [
  { key: "STRAVA", name: "Strava" },
  { key: "FITBIT", name: "Fitbit" },
  { key: "APPLE_HEALTH", name: "Apple Health" },
  { key: "GOOGLE_HEALTH_CONNECT", name: "Health Connect" },
  { key: "SAMSUNG_HEALTH", name: "Samsung Health" },
];

const GOAL_POOL = {
  "weight-loss": {
    unit: "kg",
    targets: [4, 5, 6, 8, 10, 12],
    title: (t) => `Lose ${t} kg`,
  },
  running: {
    unit: "km",
    targets: [50, 75, 100, 150, 200],
    title: (t) => `Run ${t} km`,
  },
  cycling: {
    unit: "km",
    targets: [200, 300, 500, 750, 1000],
    title: (t) => `Cycle ${t} km`,
  },
  swimming: {
    unit: "km",
    targets: [10, 15, 20, 25, 30],
    title: (t) => `Swim ${t} km`,
  },
  walking: {
    unit: "km",
    targets: [100, 150, 200, 300],
    title: (t) => `Walk ${t} km`,
  },
  gym: {
    unit: "workouts",
    targets: [20, 30, 45, 60],
    title: (t) => `Complete ${t} workouts`,
  },
  strength: {
    unit: "sessions",
    targets: [24, 36, 48, 60],
    title: (t) => `Train ${t} strength sessions`,
  },
};

const AMOUNTS_INR = [
  50000, 35000, 25000, 20000, 15000, 12000, 10000, 8000, 6000, 5000, 3000, 2000,
  1000, 500,
];
const AMOUNTS_USD = [2000, 1500, 1000, 600, 400, 300, 200, 100, 50, 25];
const FIRST = [
  "Rahul",
  "Aarav",
  "Priya",
  "Ananya",
  "Vikram",
  "Neha",
  "Arjun",
  "Isha",
  "Karan",
  "Meera",
  "Rohan",
  "Sneha",
  "Aditya",
  "Riya",
  "Aman",
  "Diya",
];
const LAST = [
  "Sharma",
  "Kapoor",
  "Patel",
  "Verma",
  "Gupta",
  "Nair",
  "Reddy",
  "Iyer",
  "Singh",
  "Bose",
];
const GRADIENTS = [
  "from-sky-500 to-indigo-600",
  "from-blue-500 to-violet-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-blue-700",
];

// ---------------------------------------------------------------------------
async function clear() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`
  );
  await client.end();
}

async function main() {
  await connectDatabase();
  await clear();

  // Categories -----------------------------------------------------------
  const categoryIdBySlug = {};
  for (const category of CATEGORIES) {
    const id = uuid();
    categoryIdBySlug[category.slug] = id;
    await db.orm.public.ChallengeCategory.create({ id, ...category });
  }

  // Fitness providers ----------------------------------------------------
  for (const provider of PROVIDERS) {
    await db.orm.public.FitnessProvider.create({
      id: uuid(),
      key: provider.key,
      name: provider.name,
      enabled: true,
    });
  }

  // Users ----------------------------------------------------------------
  const users = [];
  const admin = {
    id: uuid(),
    clerkId: "user_seed_admin",
    email: "alex@fitorlose.com",
    name: "Alex Morgan",
    role: "ADMIN",
    currency: "INR",
    createdAt: new Date("2026-02-14T09:30:00Z"),
  };
  await db.orm.public.User.create(admin);
  users.push(admin);

  for (let i = 0; i < 11; i += 1) {
    const first = FIRST[i % FIRST.length];
    const last = pick(LAST);
    const id = uuid();
    const user = {
      id,
      clerkId: `user_seed_${i + 1}`,
      email: `${first.toLowerCase()}${i + 1}@example.com`,
      name: `${first} ${last}`,
      role: "USER",
      currency: rnd() < 0.75 ? "INR" : "USD",
      createdAt: addDays(NOW, -Math.floor(rnd() * 180) - 20),
    };
    await db.orm.public.User.create(user);
    users.push(user);
  }

  const admins = users.filter((u) => u.role === "ADMIN");
  const regular = users.filter((u) => u.role === "USER");

  // Admin's connected Strava account -------------------------------------
  await db.orm.public.ConnectedAccount.create({
    id: uuid(),
    userId: admin.id,
    provider: "STRAVA",
    providerUserId: "strava_12345",
    connected: true,
    lastSyncedAt: addDays(NOW, -1),
    createdAt: new Date("2026-03-02T08:00:00Z"),
  });

  // Helper: create a challenge + its commitment payment/transaction ------
  let paySeq = 0;
  async function createChallenge(spec) {
    const id = uuid();
    await db.orm.public.Challenge.create({ id, ...spec.challenge });

    if (spec.withPayment) {
      const paymentId = uuid();
      paySeq += 1;
      await db.orm.public.Payment.create({
        id: paymentId,
        challengeId: id,
        userId: spec.challenge.ownerId,
        provider: "DODO",
        providerPaymentId: `prov_pay_${paySeq}`,
        type: "COMMITMENT",
        amount: spec.challenge.amount,
        currency: spec.challenge.currency,
        status: "SUCCEEDED",
        idempotencyKey: `commit_${id}`,
        createdAt: spec.challenge.startDate ?? spec.challenge.createdAt ?? NOW,
      });
      await db.orm.public.Transaction.create({
        id: uuid(),
        challengeId: id,
        userId: spec.challenge.ownerId,
        paymentId,
        type: "COMMITMENT",
        amount: spec.challenge.amount,
        currency: spec.challenge.currency,
        status: "SUCCEEDED",
        reference: `prov_pay_${paySeq}`,
        idempotencyKey: `txn_commit_${id}`,
        createdAt: spec.challenge.startDate ?? spec.challenge.createdAt ?? NOW,
      });
    }

    if (spec.won) {
      const rewardTxnId = uuid();
      await db.orm.public.Transaction.create({
        id: rewardTxnId,
        challengeId: id,
        userId: spec.challenge.ownerId,
        type: "REWARD",
        amount: spec.challenge.amount,
        currency: spec.challenge.currency,
        status: "REWARDED",
        reference: `reward_${id}`,
        idempotencyKey: `txn_reward_${id}`,
        createdAt: spec.challenge.settledAt ?? spec.challenge.endDate ?? NOW,
      });
      await db.orm.public.Settlement.create({
        id: uuid(),
        challengeId: id,
        userId: spec.challenge.ownerId,
        amount: spec.challenge.amount,
        currency: spec.challenge.currency,
        result: "WON",
        status: "SETTLED",
        transactionId: rewardTxnId,
        processedById: admin.id,
        idempotencyKey: `stl_${id}`,
        verifiedAt: spec.challenge.endDate,
        settledAt: spec.challenge.settledAt ?? spec.challenge.endDate,
      });
    }
    return id;
  }

  // Generate active / won / lost challenges ------------------------------
  let slugSeq = 0;
  function baseChallenge(owner, category) {
    slugSeq += 1;
    const currency = owner.currency;
    const amount = currency === "USD" ? pick(AMOUNTS_USD) : pick(AMOUNTS_INR);
    const durationDays = 30 + Math.floor(rnd() * 300);
    const goal = GOAL_POOL[category.slug];
    const goalTarget = pick(goal.targets);
    const goalUnit = goal.unit;
    const title = goal.title(goalTarget);
    const visibility = rnd() < 0.45 ? "ANONYMOUS" : "PUBLIC";
    return {
      slugSeq,
      currency,
      amount,
      durationDays,
      title,
      visibility,
      goalTarget,
      goalUnit,
    };
  }

  for (let i = 0; i < 26; i += 1) {
    const owner = pick(regular.concat(admins));
    const category = pick(CATEGORIES);
    const b = baseChallenge(owner, category);
    const elapsed = 1 + Math.floor(rnd() * (b.durationDays - 2));
    const startDate = addDays(NOW, -elapsed);
    const achieved = Math.max(
      1,
      Math.min(
        b.goalTarget - 1,
        Math.round(b.goalTarget * (0.08 + rnd() * 0.84))
      )
    );
    await createChallenge({
      withPayment: true,
      challenge: {
        slug: `active-${b.slugSeq}`,
        title: b.title,
        ownerId: owner.id,
        categoryId: categoryIdBySlug[category.slug],
        visibility: b.visibility,
        verificationType: category.defaultVerification,
        verificationProvider:
          category.defaultVerification === "MANUAL" ? null : "STRAVA",
        requirementType: category.slug === "weight-loss" ? "TOTAL" : "DAILY",
        unit: b.goalUnit,
        targetValue: b.goalTarget,
        progressValue: achieved,
        status: "ACTIVE",
        amount: b.amount,
        currency: b.currency,
        startDate,
        endDate: addDays(startDate, b.durationDays),
        durationDays: b.durationDays,
        coverGradient: pick(GRADIENTS),
        progressPercent: Math.round((achieved / b.goalTarget) * 100),
        createdAt: startDate,
      },
    });
  }

  for (let i = 0; i < 12; i += 1) {
    const owner = pick(regular.concat(admins));
    const category = pick(CATEGORIES);
    const b = baseChallenge(owner, category);
    const endDate = addDays(NOW, -(5 + Math.floor(rnd() * 60)));
    const startDate = addDays(endDate, -b.durationDays);
    await createChallenge({
      withPayment: true,
      won: true,
      challenge: {
        slug: `won-${b.slugSeq}`,
        title: b.title,
        ownerId: owner.id,
        categoryId: categoryIdBySlug[category.slug],
        visibility: b.visibility,
        verificationType: category.defaultVerification,
        verificationProvider:
          category.defaultVerification === "MANUAL" ? null : "STRAVA",
        requirementType: category.slug === "weight-loss" ? "TOTAL" : "DAILY",
        unit: b.goalUnit,
        targetValue: b.goalTarget,
        progressValue: b.goalTarget,
        status: "WON",
        amount: b.amount,
        currency: b.currency,
        startDate,
        endDate,
        durationDays: b.durationDays,
        coverGradient: pick(GRADIENTS),
        progressPercent: 100,
        settledAt: addDays(endDate, 1),
        createdAt: startDate,
      },
    });
  }

  for (let i = 0; i < 3; i += 1) {
    const owner = pick(regular);
    const category = pick(CATEGORIES);
    const b = baseChallenge(owner, category);
    const endDate = addDays(NOW, -(3 + Math.floor(rnd() * 40)));
    const startDate = addDays(endDate, -b.durationDays);
    await createChallenge({
      withPayment: true,
      challenge: {
        slug: `lost-${b.slugSeq}`,
        title: b.title,
        ownerId: owner.id,
        categoryId: categoryIdBySlug[category.slug],
        visibility: b.visibility,
        verificationType: category.defaultVerification,
        requirementType: "DAILY",
        unit: b.goalUnit,
        targetValue: b.goalTarget,
        progressValue: Math.round(b.goalTarget * (0.4 + rnd() * 0.4)),
        status: "LOST",
        amount: b.amount,
        currency: b.currency,
        startDate,
        endDate,
        durationDays: b.durationDays,
        coverGradient: pick(GRADIENTS),
        progressPercent: 40 + Math.floor(rnd() * 40),
        createdAt: startDate,
      },
    });
  }

  // Admin demo challenges (rich states for dashboard/profile) ------------
  const demoActiveId = await createChallenge({
    withPayment: true,
    challenge: {
      slug: "run-45-daily-demo",
      title: "Run 45 minutes daily",
      description:
        "Run at least 45 minutes every day for 60 days, verified automatically from Strava.",
      ownerId: admin.id,
      categoryId: categoryIdBySlug.running,
      visibility: "PUBLIC",
      verificationType: "AUTOMATIC",
      verificationProvider: "STRAVA",
      requirementType: "DAILY",
      targetValue: 60,
      progressValue: 28,
      unit: "sessions",
      status: "ACTIVE",
      amount: 8000,
      currency: "INR",
      startDate: new Date("2026-07-24T00:00:00Z"),
      endDate: new Date("2026-09-22T00:00:00Z"),
      durationDays: 60,
      coverGradient: "from-blue-500 to-cyan-600",
      progressPercent: 48,
      createdAt: new Date("2026-07-24T00:00:00Z"),
    },
  });

  const demoAwaitingId = await createChallenge({
    withPayment: true,
    challenge: {
      slug: "lose-6kg-demo",
      title: "Lose 6 kg",
      description:
        "Drop 6 kg in 120 days, verified with weekly weigh-ins reviewed by an admin.",
      ownerId: admin.id,
      categoryId: categoryIdBySlug["weight-loss"],
      visibility: "ANONYMOUS",
      verificationType: "MANUAL",
      requirementType: "TOTAL",
      startingValue: 84,
      targetValue: 6,
      progressValue: 3.8,
      unit: "kg",
      status: "AWAITING_VERIFICATION",
      amount: 12000,
      currency: "INR",
      startDate: new Date("2026-06-10T00:00:00Z"),
      endDate: new Date("2026-10-08T00:00:00Z"),
      durationDays: 120,
      coverGradient: "from-sky-500 to-indigo-600",
      progressPercent: 61,
      createdAt: new Date("2026-06-10T00:00:00Z"),
    },
  });

  await createChallenge({
    withPayment: true,
    won: true,
    challenge: {
      slug: "lose-10kg-demo",
      title: "Lose 10 kg",
      ownerId: admin.id,
      categoryId: categoryIdBySlug["weight-loss"],
      visibility: "PUBLIC",
      verificationType: "MANUAL",
      requirementType: "TOTAL",
      startingValue: 90,
      targetValue: 10,
      progressValue: 10,
      unit: "kg",
      status: "WON",
      amount: 10000,
      currency: "INR",
      startDate: new Date("2026-01-05T00:00:00Z"),
      endDate: new Date("2026-07-04T00:00:00Z"),
      durationDays: 180,
      coverGradient: "from-sky-500 to-indigo-600",
      progressPercent: 100,
      settledAt: new Date("2026-07-05T00:00:00Z"),
      createdAt: new Date("2026-01-05T00:00:00Z"),
    },
  });

  // Submissions for the awaiting demo challenge --------------------------
  await db.orm.public.Submission.create({
    id: uuid(),
    challengeId: demoAwaitingId,
    userId: admin.id,
    type: "PHOTO",
    status: "PENDING",
    label: "Week 10 weigh-in",
    createdAt: new Date("2026-08-20T07:15:00Z"),
  });
  await db.orm.public.Submission.create({
    id: uuid(),
    challengeId: demoAwaitingId,
    userId: admin.id,
    type: "PHOTO",
    status: "VERIFIED",
    label: "Week 8 weigh-in",
    reviewedById: admin.id,
    reviewedAt: new Date("2026-08-07T09:00:00Z"),
    createdAt: new Date("2026-08-06T07:20:00Z"),
  });

  // A few pending submissions from regular users (admin review queue) ----
  for (let i = 0; i < 4; i += 1) {
    const owner = regular[i];
    await db.orm.public.Submission.create({
      id: uuid(),
      challengeId: demoActiveId,
      userId: owner.id,
      type: pick(["PHOTO", "VIDEO", "SCREENSHOT", "ACTIVITY"]),
      status: "PENDING",
      label: `Proof from ${owner.name}`,
      flagged: rnd() < 0.3,
      createdAt: addDays(NOW, -Math.floor(rnd() * 3)),
    });
  }

  // Activities for the automatic demo challenge --------------------------
  const strava = await db.orm.public.ConnectedAccount.select("id")
    .take(1)
    .all();
  for (let i = 0; i < 8; i += 1) {
    await db.orm.public.Activity.create({
      id: uuid(),
      userId: admin.id,
      challengeId: demoActiveId,
      connectedAccountId: strava[0]?.id ?? null,
      provider: "STRAVA",
      externalActivityId: `strava_act_${1000 + i}`,
      activityType: "RUN",
      startedAt: addDays(NOW, -(i + 1)),
      durationSeconds: 2700 + i * 60,
      distanceMeters: 8000 + i * 200,
      sourceKind: "DEVICE_RECORDED",
      source: "Garmin",
    });
  }

  // Disputes --------------------------------------------------------------
  const someChallenges = await db.orm.public.Challenge.select("id", "ownerId")
    .take(3)
    .all();
  for (const challenge of someChallenges) {
    await db.orm.public.Dispute.create({
      id: uuid(),
      challengeId: challenge.id,
      userId: challenge.ownerId,
      reason: "Activity flagged for manual review",
      status: "OPEN",
      openedAt: addDays(NOW, -Math.floor(rnd() * 5)),
    });
  }

  // Audit logs -----------------------------------------------------------
  await db.orm.public.AuditLog.create({
    id: uuid(),
    actorId: admin.id,
    action: "SETTLEMENT_PROCESSED",
    entityType: "Settlement",
    entityId: demoActiveId,
    metadata: { amount: 10000, currency: "INR" },
  });
  await db.orm.public.AuditLog.create({
    id: uuid(),
    actorId: admin.id,
    action: "SUBMISSION_APPROVED",
    entityType: "Submission",
    entityId: demoAwaitingId,
  });

  // Status history for the awaiting demo ---------------------------------
  await db.orm.public.ChallengeStatusHistory.create({
    id: uuid(),
    challengeId: demoAwaitingId,
    fromStatus: "ACTIVE",
    toStatus: "AWAITING_VERIFICATION",
    changedById: admin.id,
    note: "Weigh-in submitted",
    createdAt: new Date("2026-08-20T07:16:00Z"),
  });

  // Counts ---------------------------------------------------------------
  const counts = {};
  for (const model of [
    "User",
    "ChallengeCategory",
    "Challenge",
    "Payment",
    "Transaction",
    "Settlement",
    "Submission",
    "Activity",
    "Dispute",
  ]) {
    const rows = await db.orm.public[model].select("id").take(1000).all();
    counts[model] = rows.length;
  }
  console.log("SEED_DONE", JSON.stringify(counts));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("SEED_FAILED", error);
    process.exit(1);
  });
