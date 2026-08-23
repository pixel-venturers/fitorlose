// Thin payment abstraction. Business logic talks to `paymentService`, never to a
// provider SDK directly (PLAN.md rule). Only Dodo Payments is wired today, but
// the provider registry keeps a future provider a drop-in addition.
import { dodoProvider } from "@/payment/providers/dodo";

const DEFAULT_PROVIDER = "DODO";
const PROVIDERS = { [dodoProvider.key]: dodoProvider };

function getProvider(key = DEFAULT_PROVIDER) {
  const provider = PROVIDERS[key];
  if (!provider) throw new Error(`Unknown payment provider: ${key}`);
  return provider;
}

export const paymentService = {
  defaultProvider: DEFAULT_PROVIDER,

  createCheckout(args, providerKey = DEFAULT_PROVIDER) {
    return getProvider(providerKey).createCheckout(args);
  },

  refundPayment(args, providerKey = DEFAULT_PROVIDER) {
    return getProvider(providerKey).refundPayment(args);
  },

  verifyWebhook(rawBody, headers, providerKey = DEFAULT_PROVIDER) {
    return getProvider(providerKey).verifyWebhook(rawBody, headers);
  },
};
