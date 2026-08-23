// Money + currency helpers for the payment layer. Amounts are stored in the DB
// as whole-currency Decimals (e.g. 100.00 INR); providers want the smallest
// unit (paise/cents), so convert here in one place — never with floats elsewhere.
import { CURRENCY } from "@/lib/constants";

// ISO country hint per billing currency (used for tax/method selection).
const CURRENCY_COUNTRY = {
  [CURRENCY.INR]: "IN",
  [CURRENCY.USD]: "US",
};

/** Whole-currency amount → integer minor units (paise/cents). */
export function toMinorUnits(amount) {
  return Math.round(Number(amount) * 100);
}

/** Integer minor units → whole-currency number. */
export function fromMinorUnits(minor) {
  return Number(minor) / 100;
}

export function currencyCountry(currency) {
  return CURRENCY_COUNTRY[currency] ?? "US";
}

// PWYW amounts are denominated in the product's BASE currency, so use a product
// whose base matches the challenge currency (falls back to the legacy single id).
export function dodoProductId(currency) {
  return (
    process.env[`DODO_PRODUCT_ID_${currency}`] ||
    process.env.DODO_PRODUCT_ID ||
    null
  );
}

/** Overlay/client SDK mode ('test' | 'live'). */
export function dodoClientMode() {
  return process.env.NEXT_PUBLIC_DODO_MODE === "live" ? "live" : "test";
}
