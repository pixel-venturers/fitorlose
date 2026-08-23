"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateCheckout } from "@/actions/Payment";
import { dodoClientMode } from "@/payment/payment-utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// The overlay SDK is a global singleton — initialize it at most once per page.
let dodoInitialized = false;

/**
 * Opens the Dodo overlay checkout for a PAYMENT_PENDING challenge. Payment truth
 * comes from the webhook, so on close/redirect we just refresh to pick up any
 * status change (PAYMENT_PENDING → SCHEDULED/ACTIVE).
 */
export function PaymentButton({
  challengeId,
  label = "Continue to payment",
  className,
  variant = "default",
  size,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const sdkRef = useRef(null);

  useEffect(() => {
    let active = true;
    import("dodopayments-checkout")
      .then((mod) => {
        if (!active) return;
        sdkRef.current = mod.DodoPayments;
        if (dodoInitialized) return;
        mod.DodoPayments.Initialize({
          mode: dodoClientMode(),
          displayType: "overlay",
          onEvent: (event) => {
            switch (event?.event_type) {
              case "checkout.error":
                toast.error(event?.data?.message ?? "Payment error.");
                setLoading(false);
                break;
              case "checkout.redirect":
                mod.DodoPayments.Checkout.close();
                setLoading(false);
                router.refresh();
                break;
              case "checkout.closed":
                setLoading(false);
                router.refresh();
                break;
              case "checkout.link_expired":
                toast.error("Payment session expired — please try again.");
                setLoading(false);
                break;
              default:
                break;
            }
          },
        });
        dodoInitialized = true;
      })
      .catch(() => {
        toast.error("Couldn't load the payment SDK.");
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handlePay() {
    if (loading) return;
    setLoading(true);
    const result = await CreateCheckout({ challengeId });
    if (!result.ok) {
      setLoading(false);
      toast.error(result.error?.message ?? "Couldn't start checkout.");
      return;
    }
    const sdk = sdkRef.current;
    if (!sdk) {
      setLoading(false);
      toast.error("Payment is still loading — please try again.");
      return;
    }
    sdk.Checkout.open({ checkoutUrl: result.data.checkoutUrl });
  }

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? "Opening checkout…" : label}
    </Button>
  );
}
