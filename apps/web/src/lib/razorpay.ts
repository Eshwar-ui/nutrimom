// Loads the Razorpay Checkout script once and exposes a typed opener.

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}

/** `error` payload of the gateway's `payment.failed` event. */
export interface RazorpayFailure {
  code?: string;
  description?: string;
  reason?: string;
  step?: string;
  source?: string;
  metadata?: { order_id?: string; payment_id?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: { error?: RazorpayFailure }) => void,
  ) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.body.appendChild(script);
  });
}

/**
 * Open the gateway checkout. `onFailed` fires on a declined/failed attempt —
 * the modal stays open so the buyer can retry with another method, and
 * `modal.ondismiss` still runs if they then close it. Nothing is settled here:
 * only the signed `handler` callback marks a payment good.
 */
export function openRazorpay(
  options: RazorpayOptions,
  onFailed?: (message: string) => void,
) {
  if (!window.Razorpay) throw new Error("Razorpay not loaded");
  const instance = new window.Razorpay(options);
  if (onFailed) {
    instance.on("payment.failed", (response) =>
      onFailed(describeFailure(response.error)),
    );
  }
  instance.open();
}

/** Gateway failure reasons are buyer-readable; fall back when one is missing. */
export function describeFailure(error: RazorpayFailure | undefined): string {
  return (
    error?.description ??
    error?.reason ??
    "Your payment could not be completed. Please try another method."
  );
}
