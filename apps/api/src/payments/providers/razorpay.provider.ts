import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import type { Env } from '../../config/env.validation';
import type {
  GatewayOrder,
  PaymentProvider,
  RefundResult,
  WebhookResult,
} from '../payment-provider.interface';

/** Razorpay's floor for a chargeable order — ₹1. */
const MIN_AMOUNT_PAISE = 100;

/** Razorpay adapter for the gateway-agnostic PaymentProvider contract. */
@Injectable()
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay';
  private readonly logger = new Logger(RazorpayProvider.name);
  private readonly razorpay: Razorpay;
  readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService<Env, true>) {
    this.keyId = config.get('RAZORPAY_KEY_ID', { infer: true });
    this.keySecret = config.get('RAZORPAY_KEY_SECRET', { infer: true });
    this.webhookSecret = config.get('RAZORPAY_WEBHOOK_SECRET', { infer: true });
    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });

    // Placeholder credentials still satisfy env validation (they're non-empty),
    // so every payment would fail at the gateway with a 401 instead. Say so at
    // boot rather than letting it look like a runtime bug later.
    if (/x{4,}/i.test(this.keyId) || /x{4,}/i.test(this.keySecret)) {
      this.logger.error(
        'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET still look like placeholders — ' +
          'every payment will be rejected by the gateway. Set real keys in apps/api/.env and restart.',
      );
    }
    if (/x{4,}/i.test(this.webhookSecret)) {
      this.logger.warn(
        'RAZORPAY_WEBHOOK_SECRET is still a placeholder — webhook deliveries will be rejected. ' +
          'Generate it in Dashboard → Settings → Webhooks. Verify-on-return still settles orders.',
      );
    }
  }

  async createOrder(
    amountInPaise: number,
    receipt: string,
  ): Promise<GatewayOrder> {
    // Razorpay rejects anything under ₹1 with an opaque gateway error; fail
    // here instead so the caller sees a 400 naming the real problem.
    if (!Number.isInteger(amountInPaise) || amountInPaise < MIN_AMOUNT_PAISE) {
      throw new BadRequestException(
        `Payment amount must be a whole number of paise and at least ${MIN_AMOUNT_PAISE} (₹1)`,
      );
    }
    try {
      const rzp = await this.razorpay.orders.create({
        amount: amountInPaise, // authoritative amount from our DB
        currency: 'INR',
        receipt,
      });
      return { gatewayOrderId: rzp.id, keyId: this.keyId, currency: 'INR' };
    } catch (err) {
      throw this.gatewayFailure('create order', err);
    }
  }

  /**
   * Turn a raw SDK rejection into something diagnosable. Left unhandled these
   * surface as a bare 500 with nothing in the log, which makes a misconfigured
   * key or an unreachable gateway indistinguishable from a real server bug.
   */
  private gatewayFailure(action: string, err: unknown): Error {
    const detail = err as {
      statusCode?: number;
      error?: { code?: string; description?: string };
      message?: string;
    };
    const status = detail?.statusCode;
    const description =
      detail?.error?.description ?? detail?.message ?? 'unknown error';

    // 401/403 from Razorpay means our own credentials are wrong — an operator
    // problem the logs must name outright, never the buyer's fault.
    if (status === 401 || status === 403) {
      this.logger.error(
        `Razorpay rejected our credentials on ${action} (HTTP ${status}: ${description}). ` +
          `Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — the API must be restarted after changing them.`,
      );
      return new ServiceUnavailableException(
        'Payments are temporarily unavailable. Please try again shortly.',
      );
    }

    this.logger.error(
      `Razorpay ${action} failed${status ? ` (HTTP ${status})` : ''}: ${description}`,
      err instanceof Error ? err.stack : undefined,
    );
    return new ServiceUnavailableException(
      'Our payment provider is not responding right now. Please try again in a moment.',
    );
  }

  verifySignature(input: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature: string;
  }): boolean {
    const expected = createHmac('sha256', this.keySecret)
      .update(`${input.gatewayOrderId}|${input.gatewayPaymentId}`)
      .digest('hex');
    return safeEqual(expected, input.signature);
  }

  parseWebhook(rawBody: Buffer, signature: string | undefined): WebhookResult {
    if (!signature) throw new BadRequestException('Missing signature');
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    if (!safeEqual(expected, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: { order_id?: string; id?: string; amount?: number };
        };
      };
    };
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      return {
        settled: true,
        gatewayOrderId: payment?.order_id,
        gatewayPaymentId: payment?.id,
        amountInPaise: payment?.amount,
      };
    }
    return { settled: false };
  }

  async refund(
    gatewayPaymentId: string,
    amountInPaise: number,
  ): Promise<RefundResult> {
    try {
      const refund = await this.razorpay.payments.refund(gatewayPaymentId, {
        amount: amountInPaise,
      });
      return { refundId: refund.id };
    } catch (err) {
      throw this.gatewayFailure(`refund ${gatewayPaymentId}`, err);
    }
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
