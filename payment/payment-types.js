// Normalized payment event names shared across the payment abstraction.
// Providers map their own event names onto these.
export const PAYMENT_EVENT = {
  SUCCEEDED: "payment.succeeded",
  FAILED: "payment.failed",
  CANCELLED: "payment.cancelled",
  PROCESSING: "payment.processing",
};
