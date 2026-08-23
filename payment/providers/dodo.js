// Dodo Payments provider. Wraps the official `dodopayments` Node SDK behind the
// PaymentService contract: create a hosted checkout session (opened as an
// overlay on the client) and verify inbound webhooks. Server-only — the API key
// and webhook secret must never reach the browser.
import "server-only";

import {
  currencyCountry,
  dodoProductId,
  toMinorUnits,
} from "@/payment/payment-utils";
import DodoPayments from "dodopayments";

let client;

function getClient() {
  if (client) return client;
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) throw new Error("DODO_PAYMENTS_API_KEY is not set.");
  client = new DodoPayments({
    bearerToken,
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
        ? "live_mode"
        : "test_mode",
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  });
  return client;
}

export const dodoProvider = {
  key: "DODO",

  /**
   * Create a single-use hosted checkout session for a dynamic (PWYW) amount in
   * the challenge's currency. Returns { sessionId, checkoutUrl }.
   */
  async createCheckout({ amount, currency, customer, metadata, returnUrl }) {
    const productId = dodoProductId(currency);
    if (!productId)
      throw new Error(`No Dodo product configured for ${currency}.`);

    const session = await getClient().checkoutSessions.create({
      product_cart: [
        { product_id: productId, quantity: 1, amount: toMinorUnits(amount) },
      ],
      customer: { email: customer.email, name: customer.name || undefined },
      billing_address: { country: currencyCountry(currency) },
      billing_currency: currency,
      return_url: returnUrl,
      metadata,
      // Let the payer switch currency and pick any enabled method (UPI, cards…).
      feature_flags: {
        allow_currency_selection: true,
        allow_phone_number_collection: true,
        require_phone_number: true,
      },
      customization: { theme: "dark", show_order_details: true },
    });

    return { sessionId: session.session_id, checkoutUrl: session.checkout_url };
  },

  /**
   * Refund a settled payment (how we pay out a won challenge). A full refund of
   * the original commitment by default. Idempotent when an idempotencyKey is
   * given — Dodo returns the same refund instead of issuing a second one, so a
   * retry never pays twice. Returns { refundId, status, amount, currency }.
   */
  async refundPayment({ paymentId, reason, idempotencyKey }) {
    if (!paymentId) throw new Error("refundPayment requires a paymentId.");
    const refund = await getClient().refunds.create(
      { payment_id: paymentId, reason: reason ?? undefined },
      idempotencyKey ? { idempotencyKey } : undefined
    );
    return {
      refundId: refund.refund_id,
      status: refund.status,
      amount: refund.amount ?? null,
      currency: refund.currency ?? null,
    };
  },

  /** Verify + parse a webhook. Throws on an invalid signature. */
  verifyWebhook(rawBody, headers) {
    return getClient().webhooks.unwrap(rawBody, { headers });
  },
};
