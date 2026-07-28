// One place that decides what a failed payment attempt actually *means* to the
// buyer, so checkout, the order page and seller billing all say the same thing.
//
// The distinction that matters most is whether money left the buyer's account.
// Everything the gateway rejects (declined card, dismissed modal, blocked
// script) is safe — nothing was charged. But if the gateway captured the payment
// and our own verify call then failed, the buyer HAS paid and must never be told
// "payment failed"; the webhook settles it shortly after. That case is
// `captured-unconfirmed` and it's the reason this module exists.

import { ApiError } from "./api";

/**
 * Thrown when the gateway captured the payment but our verify call failed.
 * Carries the payment id so the buyer has a reference to quote, and lets
 * callers that only see a rejected promise still tell "charged" from "not".
 */
export class PaymentCapturedError extends Error {
  constructor(
    readonly paymentId: string,
    override readonly cause?: unknown,
  ) {
    super("Payment captured but not yet confirmed");
    this.name = "PaymentCapturedError";
  }
}

/** Thrown when the buyer closed the gateway modal without paying. */
export class PaymentCancelledError extends Error {
  constructor() {
    super("Payment cancelled");
    this.name = "PaymentCancelledError";
  }
}

export type PaymentOutcomeKind =
  | "captured-unconfirmed"
  | "declined"
  | "cancelled"
  | "script-blocked"
  | "offline"
  | "rate-limited"
  | "session-expired"
  | "item-unavailable"
  | "already-settled"
  | "amount-too-small"
  | "server-error"
  | "unknown";

export interface PaymentOutcome {
  kind: PaymentOutcomeKind;
  /** Was the buyer's money actually taken? Drives the whole tone of the UI. */
  charged: boolean;
  tone: "success" | "warning" | "error" | "neutral";
  title: string;
  description: string;
  /** Label for the primary action, when retrying makes sense. */
  retryLabel?: string;
  /** Shown as a monospace reference the buyer can quote to support. */
  reference?: string;
}

/** Gateway-side failure (declined card, expired OTP…). Nothing was charged. */
export function declinedOutcome(message: string): PaymentOutcome {
  return {
    kind: "declined",
    charged: false,
    tone: "error",
    title: "Payment didn't go through",
    description: `${message} You have not been charged — you can try again with a different method.`,
    retryLabel: "Try again",
  };
}

export function cancelledOutcome(): PaymentOutcome {
  return {
    kind: "cancelled",
    charged: false,
    tone: "neutral",
    title: "Payment cancelled",
    description:
      "You closed the payment window before finishing. Nothing was charged and your order is still waiting for payment.",
    retryLabel: "Pay now",
  };
}

/**
 * The gateway took the money but our verify call didn't complete. The payment
 * is real; settlement just hasn't been recorded yet. Never call this "failed".
 */
export function capturedUnconfirmedOutcome(paymentId?: string): PaymentOutcome {
  return {
    kind: "captured-unconfirmed",
    charged: true,
    tone: "warning",
    title: "Payment received — confirming your order",
    description:
      "Your payment went through, but we couldn't confirm it on our side just yet. Nothing is lost: this usually settles within a minute or two, and your order updates automatically. If it still looks unpaid after that, contact us with the reference below.",
    retryLabel: "Check again",
    reference: paymentId,
  };
}

/** checkout.js never loaded — almost always an ad/script blocker or dead network. */
export function scriptBlockedOutcome(): PaymentOutcome {
  return {
    kind: "script-blocked",
    charged: false,
    tone: "error",
    title: "Couldn't open the payment window",
    description:
      "Our payment provider's checkout script didn't load. This is usually caused by an ad blocker, a privacy extension, or a shaky connection. Disable blockers for this site and try again — you have not been charged.",
    retryLabel: "Try again",
  };
}

/**
 * Classify an error thrown while starting or verifying a payment.
 * `charged` tells us whether the gateway had already captured the money at the
 * point the error happened — that flips a "failed" into a "confirming" state.
 */
export function classifyPaymentError(
  err: unknown,
  opts: { charged?: boolean; paymentId?: string } = {},
): PaymentOutcome {
  if (err instanceof PaymentCapturedError) {
    return capturedUnconfirmedOutcome(err.paymentId);
  }
  if (err instanceof PaymentCancelledError) return cancelledOutcome();
  if (opts.charged) return capturedUnconfirmedOutcome(opts.paymentId);

  if (err instanceof ApiError) {
    // status 0 = the request never reached the API (offline / DNS / CORS).
    if (err.status === 0) {
      return {
        kind: "offline",
        charged: false,
        tone: "error",
        title: "You appear to be offline",
        description:
          "We couldn't reach our servers, so the payment wasn't started. Check your connection and try again — nothing was charged.",
        retryLabel: "Try again",
      };
    }
    if (err.status === 429) {
      return {
        kind: "rate-limited",
        charged: false,
        tone: "warning",
        title: "Too many attempts",
        description:
          "You've made a lot of requests in a short time, so we've paused them briefly. Wait about a minute and try again — nothing was charged.",
        retryLabel: "Try again",
      };
    }
    if (err.status === 401 || err.status === 403) {
      return {
        kind: "session-expired",
        charged: false,
        tone: "warning",
        title: "Please sign in again",
        description:
          "Your session expired before the payment could start. Sign in again and your order will still be waiting — nothing was charged.",
      };
    }
    if (err.status >= 500) {
      return {
        kind: "server-error",
        charged: false,
        tone: "error",
        title: "Something went wrong on our side",
        description:
          "We hit an unexpected error before taking any payment. Please try again in a moment — you have not been charged.",
        retryLabel: "Try again",
      };
    }
    if (err.status === 400 || err.status === 404) {
      const message = err.message || "";
      if (/no longer available|not available|unavailable/i.test(message)) {
        return {
          kind: "item-unavailable",
          charged: false,
          tone: "warning",
          title: "That item is no longer available",
          description:
            "Someone else bought it while you were checking out, so we didn't take any payment. Your cart has been left untouched so you can pick something else.",
        };
      }
      if (/not awaiting payment|already/i.test(message)) {
        return {
          kind: "already-settled",
          charged: false,
          tone: "neutral",
          title: "This order is already handled",
          description:
            "It's either been paid for or cancelled, so there's nothing left to pay. Open the order to see its current status.",
        };
      }
      if (/at least 100|amount must be/i.test(message)) {
        return {
          kind: "amount-too-small",
          charged: false,
          tone: "error",
          title: "This amount can't be charged",
          description:
            "Online payments have to be at least ₹1. Please contact us so we can sort this order out for you.",
        };
      }
      return {
        kind: "unknown",
        charged: false,
        tone: "error",
        title: "We couldn't start the payment",
        description: `${message} You have not been charged.`,
        retryLabel: "Try again",
      };
    }
  }

  if (err instanceof Error && /razorpay|load/i.test(err.message)) {
    return scriptBlockedOutcome();
  }

  return {
    kind: "unknown",
    charged: false,
    tone: "error",
    title: "We couldn't complete the payment",
    description:
      err instanceof Error && err.message
        ? `${err.message} If you were charged, it will be refunded automatically.`
        : "An unexpected error stopped the payment. If you were charged, it will be refunded automatically.",
    retryLabel: "Try again",
  };
}
