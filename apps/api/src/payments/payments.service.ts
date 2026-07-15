import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Order,
  RazorpayOrderResponse,
  VerifyPaymentInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /** Create the gateway order the browser will pay against. */
  async createGatewayOrder(
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

    const gateway = await this.provider.createOrder(
      order.totalInPaise,
      order.id,
    );

    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: gateway.gatewayOrderId },
    });

    return {
      orderId: order.id,
      razorpayOrderId: gateway.gatewayOrderId,
      amountInPaise: order.totalInPaise,
      currency: gateway.currency,
      keyId: gateway.keyId,
    };
  }

  async verify(buyerId: string, input: VerifyPaymentInput): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (order.razorpayOrderId !== input.razorpayOrderId) {
      throw new BadRequestException('Payment order mismatch');
    }

    const valid = this.provider.verifySignature({
      gatewayOrderId: input.razorpayOrderId,
      gatewayPaymentId: input.razorpayPaymentId,
      signature: input.razorpaySignature,
    });
    if (!valid) throw new BadRequestException('Invalid payment signature');

    await this.settle(input.razorpayOrderId, input.razorpayPaymentId);
    return this.orders.getMine(buyerId, input.orderId);
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const event = this.provider.parseWebhook(rawBody, signature);
    if (event.settled && event.gatewayOrderId && event.gatewayPaymentId) {
      await this.settle(event.gatewayOrderId, event.gatewayPaymentId);
    }
    return { received: true };
  }

  /**
   * Mark the order PAID, flip each listing to SOLD, and notify sellers + admins
   * — exactly once. The order status guard makes this idempotent (verify +
   * webhook can both call it); the per-listing status guard prevents a listing
   * from being double-sold across concurrent carts.
   */
  private async settle(gatewayOrderId: string, paymentId: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { razorpayOrderId: gatewayOrderId },
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
