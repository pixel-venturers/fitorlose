// Application data-access layer: a single pooled `pg` connection with small
// query helpers and a transaction wrapper. Phase 3 uses parameterized SQL for
// reliability and full control (joins, aggregates, row locking for money).
// The Prisma v8 ORM runtime (prisma/db.js) remains for seeding.
import pg from "pg";

const globalForDb = globalThis;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  }
  return new pg.Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

// Reuse one pool across HMR reloads in dev and warm serverless invocations.
export const pool = globalForDb.__folPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__folPool = pool;
}

/** Run a parameterized query and return the rows. */
export async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

/** Run a parameterized query and return the first row (or null). */
export async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

/** Run `fn` inside a transaction. Rolls back on any thrown error. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
