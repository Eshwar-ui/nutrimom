import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import type { Env } from '../../config/env.validation';
import type {
  GatewayOrder,
  PaymentProvider,
  WebhookResult,
} from '../payment-provider.interface';

/** Razorpay adapter for the gateway-agnostic PaymentProvider contract. */
@Injectable()
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay';
  private readonly razorpay: Razorpay;
  private readonly keyId: string;
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
  }

  async createOrder(
    amountInPaise: number,
    receipt: string,
  ): Promise<GatewayOrder> {
    const rzp = await this.razorpay.orders.create({
      amount: amountInPaise, // authoritative amount from our DB
      currency: 'INR',
      receipt,
    });
    return { gatewayOrderId: rzp.id, keyId: this.keyId, currency: 'INR' };
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
      payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
    };
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      return {
        settled: true,
        gatewayOrderId: payment?.order_id,
        gatewayPaymentId: payment?.id,
      };
    }
    return { settled: false };
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
