// Gateway-agnostic payment contract. PaymentsService and the order flow depend
// on this interface, never on a concrete gateway — so swapping Razorpay for
// Cashfree/PhonePe later is a new adapter file + a config switch, not a rewrite.

export interface GatewayOrder {
  /** The gateway's order id (stored on our Order as razorpayOrderId). */
  gatewayOrderId: string;
  /** Public key/id the browser needs to open the gateway's checkout. */
  keyId: string;
  currency: string;
}

export interface WebhookResult {
  /** True when the event means "payment captured / order paid". */
  settled: boolean;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  /** Captured amount, when the event carries one — used to catch under/over-capture. */
  amountInPaise?: number;
}

export interface RefundResult {
  refundId: string;
}

export interface PaymentProvider {
  /** Adapter name, e.g. 'razorpay'. */
  readonly name: string;

  /** Public key/id the browser needs to open the gateway's checkout. */
  readonly keyId: string;

  /** Create a gateway order for `amountInPaise`; `receipt` is our order id. */
  createOrder(amountInPaise: number, receipt: string): Promise<GatewayOrder>;

  /** Verify the client-returned payment signature (post-checkout). */
  verifySignature(input: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature: string;
  }): boolean;

  /** Verify + parse a gateway webhook. Throws on an invalid signature. */
  parseWebhook(rawBody: Buffer, signature: string | undefined): WebhookResult;

  /** Refund a captured payment, in full or in part. */
  refund(
    gatewayPaymentId: string,
    amountInPaise: number,
  ): Promise<RefundResult>;
}

// DI token for the selected provider.
export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';
