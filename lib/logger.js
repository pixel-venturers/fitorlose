// Centralized logger. Never log secrets, tokens, payment credentials or PII.
const isDev = process.env.NODE_ENV !== "production";

function line(level, message, meta) {
  const payload = meta === undefined ? "" : safe(meta);
  return `[${new Date().toISOString()}] ${level} ${message}${payload ? ` ${payload}` : ""}`;
}

function safe(meta) {
  try {
    if (meta instanceof Error) return meta.stack ?? meta.message;
    return typeof meta === "string" ? meta : JSON.stringify(meta);
  } catch {
    return "";
  }
}

export const logger = {
  info(message, meta) {
    console.log(line("INFO", message, meta));
  },
  warn(message, meta) {
    console.warn(line("WARN", message, meta));
  },
  error(message, meta) {
    console.error(line("ERROR", message, meta));
  },
  debug(message, meta) {
    if (isDev) console.debug(line("DEBUG", message, meta));
  },
};
