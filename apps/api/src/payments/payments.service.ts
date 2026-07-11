import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import type {
  Order,
  RazorpayOrderResponse,
  VerifyPaymentInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { Env } from '../config/env.validation';

@Injectable()
export class PaymentsService {
  private readonly razorpay: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly notifications: NotificationsService,
    config: ConfigService<Env, true>,
  ) {
    this.keyId = config.get('RAZORPAY_KEY_ID', { infer: true });
    this.keySecret = config.get('RAZORPAY_KEY_SECRET', { infer: true });
    this.webhookSecret = config.get('RAZORPAY_WEBHOOK_SECRET', { infer: true });
    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  async createRazorpayOrder(
    buyerId: string,
    internalOrderId: string,
  ): Promise<RazorpayOrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: internalOrderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not awaiting payment');
    }

    const rzpOrder = await this.razorpay.orders.create({
      amount: order.totalInPaise, // authoritative amount from our DB
      currency: 'INR',
      receipt: order.id,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return {
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amountInPaise: order.totalInPaise,
      currency: 'INR',
      keyId: this.keyId,
    };
  }

  async verify(buyerId: string, input: VerifyPaymentInput): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (order.razorpayOrderId !== input.razorpayOrderId) {
      throw new BadRequestException('Razorpay order mismatch');
    }

    const expected = createHmac('sha256', this.keySecret)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest('hex');
    if (!safeEqual(expected, input.razorpaySignature)) {
      throw new BadRequestException('Invalid payment signature');
    }

    await this.settle(input.razorpayOrderId, input.razorpayPaymentId);
    return this.orders.getMine(buyerId, input.orderId);
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) throw new BadRequestException('Missing signature');
    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    if (!safeEqual(expected, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8'));
    if (event?.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        await this.settle(payment.order_id, payment.id);
      }
    }
    return { received: true };
  }

  /**
   * Mark the order PAID, flip each listing to SOLD, and notify sellers + admins
   * — exactly once. The order status guard makes this idempotent (verify +
   * webhook can both call it); the per-listing status guard prevents a listing
   * from being double-sold across concurrent carts.
   */
  private async settle(razorpayOrderId: string, paymentId: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { razorpayOrderId },
        include: { items: true },
      });
      if (!order) return;

      const transitioned = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'PAID', razorpayPaymentId: paymentId },
      });
      if (transitioned.count === 0) return; // already settled — idempotent

      for (const item of order.items) {
        await tx.listing.updateMany({
          where: {
            id: item.listingId,
            status: { in: ['APPROVED', 'RESERVED'] },
          },
          data: { status: 'SOLD' },
        });
        await this.notifications.create(
          item.sellerId,
          'ITEM_SOLD',
          `Your item "${item.listingTitle}" has sold. Please arrange handover.`,
          item.listingId,
          tx,
        );
      }
      await this.notifications.notifyAdmins(
        'ORDER_PLACED',
        `New paid order ${order.id.slice(-6).toUpperCase()} — ${order.items.length} item(s).`,
        null,
        tx,
      );
    });
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
