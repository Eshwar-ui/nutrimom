import type {
  MembershipPlan,
  SellerBillingStatus,
  SellerCheckoutResponse,
} from "@nutrimom/shared";
import { authedRequest } from "./api";
import { loadRazorpay, openRazorpay } from "./razorpay";

type Prefill = { name?: string; email?: string; contact?: string };

export function getBillingStatus() {
  return authedRequest<SellerBillingStatus>("/seller/billing/status");
}

/** Open the gateway for a seller checkout and settle it on the verified callback. */
async function payAndVerify(
  checkout: SellerCheckoutResponse,
  description: string,
  prefill: Prefill,
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
          .catch((err: unknown) =>
            reject(err instanceof Error ? err : new Error("Verification failed")),
          );
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
  });
}

export async function payRegistration(
  prefill: Prefill,
): Promise<SellerBillingStatus> {
  const checkout = await authedRequest<SellerCheckoutResponse>(
    "/seller/billing/registration",
    { method: "POST" },
  );
  return payAndVerify(checkout, "Seller registration", prefill);
}

export async function payMembership(
  plan: MembershipPlan,
  prefill: Prefill,
): Promise<SellerBillingStatus> {
  const checkout = await authedRequest<SellerCheckoutResponse>(
    "/seller/billing/membership",
    { method: "POST", body: { plan } },
  );
  return payAndVerify(checkout, "Seller membership", prefill);
}
