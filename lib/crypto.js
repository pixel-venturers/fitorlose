// Server-only. Symmetric encryption for provider access/refresh tokens (never
// stored in plaintext, never sent to the browser) and stateless signed state
// for OAuth CSRF protection. Keyed by FITNESS_TOKEN_ENCRYPTION_KEY.
import "server-only";

import crypto from "node:crypto";

const SECRET = process.env.FITNESS_TOKEN_ENCRYPTION_KEY || "";
const ENC_PREFIX = "v1";

// Derive a stable 32-byte key from the configured secret + a domain label so
// encryption and signing never share the same key material.
function keyFor(label) {
  return crypto.createHash("sha256").update(`${label}:${SECRET}`).digest();
}

function requireSecret() {
  if (!SECRET) {
    throw new Error(
      "FITNESS_TOKEN_ENCRYPTION_KEY is not set — required to store provider tokens securely."
    );
  }
}

/** AES-256-GCM encrypt a string. Returns null for empty input. */
export function encryptSecret(plain) {
  if (plain == null || plain === "") return null;
  requireSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFor("enc"), iv);
  const ct = Buffer.concat([
    cipher.update(String(plain), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    ENC_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ct.toString("base64"),
  ].join(":");
}

/** Decrypt a value produced by encryptSecret. Returns null on any failure. */
export function decryptSecret(payload) {
  if (!payload) return null;
  try {
    requireSecret();
    const [prefix, ivB64, tagB64, ctB64] = String(payload).split(":");
    if (prefix !== ENC_PREFIX) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      keyFor("enc"),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, "base64")),
      decipher.final(),
    ]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}

/** Sign a small JSON payload (OAuth state / CSRF). Stateless — no DB row. */
export function signState(data) {
  requireSecret();
  const body = Buffer.from(
    JSON.stringify({ ...data, ts: Date.now() })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", keyFor("state"))
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

/** Verify + parse a signed state. Null if tampered or older than maxAgeMs. */
export function verifyState(token, { maxAgeMs = 10 * 60_000 } = {}) {
  try {
    requireSecret();
    const [body, sig] = String(token).split(".");
    if (!body || !sig) return null;
    const expected = crypto
      .createHmac("sha256", keyFor("state"))
      .update(body)
      .digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof data.ts !== "number" || Date.now() - data.ts > maxAgeMs) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
