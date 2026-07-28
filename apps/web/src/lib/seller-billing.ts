import type {
  MembershipPlan,
  SellerBillingStatus,
  SellerCheckoutResponse,
} from "@nutrimom/shared";
import { authedRequest } from "./api";
import { loadRazorpay, openRazorpay } from "./razorpay";
import { toast } from "./toast-store";
import {
  PaymentCancelledError,
  PaymentCapturedError,
  declinedOutcome,
} from "./payment-outcome";

type Prefill = { name?: string; email?: string; contact?: string };

/** Lets the page show a "don't close this window" overlay while we verify. */
export interface PayHooks {
  onVerifyStart?: () => void;
  onVerifyEnd?: () => void;
}

export function getBillingStatus() {
  return authedRequest<SellerBillingStatus>("/seller/billing/status");
}

/** Open the gateway for a seller checkout and settle it on the verified callback. */
async function payAndVerify(
  checkout: SellerCheckoutResponse,
  description: string,
  prefill: Prefill,
  { onVerifyStart, onVerifyEnd }: PayHooks = {},
): Promise<SellerBillingStatus> {
  await loadRazorpay();
  return new Promise<SellerBillingStatus>((resolve, reject) => {
    openRazorpay({
      key: checkout.keyId,
      amount: checkout.amountInPaise,
      currency: checkout.currency,
      name: "Preloved by The Nurture Moms",
      description,
      order_id: checkout.razorpayOrderId,
      prefill,
      theme: { color: "#e8756a" },
      handler: (resp) => {
        onVerifyStart?.();
        authedRequest<SellerBillingStatus>("/seller/billing/verify", {
          method: "POST",
          body: {
            sellerPaymentId: checkout.sellerPaymentId,
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
          },
        })
          .then(resolve)
          // The gateway already took the money here, so surface it as
          // "captured, not yet confirmed" rather than a generic failure.
          .catch((err: unknown) =>
            reject(new PaymentCapturedError(resp.razorpay_payment_id, err)),
          )
          .finally(() => onVerifyEnd?.());
      },
      modal: { ondismiss: () => reject(new PaymentCancelledError()) },
    },
      // Surface the decline but don't settle the promise — the modal stays open
      // and a retry can still succeed. Only dismiss or a verified payment ends it.
      (message) => toast.error(declinedOutcome(message).description),
    );
  });
}

export async function payRegistration(
  prefill: Prefill,
  hooks?: PayHooks,
): Promise<SellerBillingStatus> {
  const checkout = await authedRequest<SellerCheckoutResponse>(
    "/seller/billing/registration",
    { method: "POST" },
  );
  return payAndVerify(checkout, "Seller registration", prefill, hooks);
}

export async function payMembership(
  plan: MembershipPlan,
  prefill: Prefill,
  hooks?: PayHooks,
): Promise<SellerBillingStatus> {
  const checkout = await authedRequest<SellerCheckoutResponse>(
    "/seller/billing/membership",
    { method: "POST", body: { plan } },
  );
  return payAndVerify(checkout, "Seller membership", prefill, hooks);
}
