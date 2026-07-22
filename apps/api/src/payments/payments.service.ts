import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /**
   * Create (or reuse) the gateway order the browser will pay against. A
   * PENDING order that already has an open gateway order — e.g. the buyer
   * dismissed the checkout modal and is retrying — reuses it instead of
   * minting a new one. Otherwise a payment made against the earlier gateway
   * order would never match anything by the time it reaches settle().
   */
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

    if (order.razorpayOrderId) {
      const keyId = this.provider.keyId;
      return {
        orderId: order.id,
        razorpayOrderId: order.razorpayOrderId,
        amountInPaise: order.totalInPaise,
        currency: 'INR',
        keyId,
      };
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
      await this.settle(
        event.gatewayOrderId,
        event.gatewayPaymentId,
        event.amountInPaise,
      );
    }
    return { received: true };
  }

  /**
   * Mark the order PAID, flip each listing to SOLD, and notify sellers + admins
   * — exactly once. The order status guard makes this idempotent (verify +
   * webhook can both call it). A listing is only flipped to SOLD if this order
   * is still its recorded `holdOrderId` (set atomically at order-creation) —
   * that's what prevents a second buyer's order from ever reaching PAID with
   * the same item, since OrdersService.create() already refused to let two
   * orders hold the same listing at once.
   *
   * Three cases can't be fulfilled even though the charge succeeded — a
   * payment against an order the buyer already cancelled, a mismatched
   * captured amount, or a lost hold (the 30-minute reservation expired mid
   * checkout). The first and third refund the buyer and cancel the order;
   * the second holds the order untouched for manual reconciliation, since a
   * mismatch could be either our bug or a gateway-side partial capture and
   * refunding blind could compound it.
   */
  private async settle(
    gatewayOrderId: string,
    paymentId: string,
    capturedAmountInPaise?: number,
  ) {
    const outcome = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { razorpayOrderId: gatewayOrderId },
        include: { items: true },
      });
      if (!order) return null;

      if (order.status === 'CANCELLED') {
        return {
          kind: 'refund' as const,
          orderId: order.id,
          buyerId: order.buyerId,
          amountInPaise: order.totalInPaise,
          reason: 'your order was cancelled before payment completed',
        };
      }

      if (
        capturedAmountInPaise !== undefined &&
        capturedAmountInPaise !== order.totalInPaise
      ) {
        this.logger.error(
          `Order ${order.id}: captured amount ${capturedAmountInPaise} does not match order total ${order.totalInPaise} — holding for manual reconciliation`,
        );
        return null;
      }

      const transitioned = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'PAID', razorpayPaymentId: paymentId },
      });
      if (transitioned.count === 0) return null; // already settled — idempotent

      const claims: { item: (typeof order.items)[number]; claimed: boolean }[] =
        [];
      for (const item of order.items) {
        const claimed = await tx.listing.updateMany({
          where: { id: item.listingId, holdOrderId: order.id },
          data: { status: 'SOLD', reservedUntil: null },
        });
        claims.push({ item, claimed: claimed.count > 0 });
      }

      const lost = claims.filter((c) => !c.claimed);
      if (lost.length > 0) {
        this.logger.warn(
          `Order ${order.id} settled as PAID but lost its hold on ${lost.length} listing(s) — reversing the sale and refunding`,
        );
        const claimedIds = claims
          .filter((c) => c.claimed)
          .map((c) => c.item.listingId);
        if (claimedIds.length > 0) {
          // The order can't be fulfilled as a whole, so release whichever
          // items it did manage to claim too rather than leave them SOLD
          // against a cancelled order.
          await tx.listing.updateMany({
            where: { id: { in: claimedIds }, holdOrderId: order.id },
            data: {
              status: 'APPROVED',
              holdOrderId: null,
              reservedById: null,
              reservedUntil: null,
            },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED', razorpayPaymentId: paymentId },
        });
        return {
          kind: 'refund' as const,
          orderId: order.id,
          buyerId: order.buyerId,
          amountInPaise: order.totalInPaise,
          reason:
            'one or more items in your order became unavailable before payment completed',
        };
      }

      for (const { item } of claims) {
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
      return { kind: 'paid' as const };
    });

    if (outcome?.kind === 'refund') {
      await this.issueRefund(
        outcome.orderId,
        outcome.buyerId,
        paymentId,
        outcome.amountInPaise,
        outcome.reason,
      );
    }
  }

  /**
   * Best-effort refund for a captured payment we can't fulfil. The order is
   * already CANCELLED in the DB by the time this runs; a failure here is
   * logged for manual follow-up rather than thrown, since the caller
   * (verify/webhook) still needs to return successfully to the gateway.
   */
  private async issueRefund(
    orderId: string,
    buyerId: string,
    gatewayPaymentId: string,
    amountInPaise: number,
    reason: string,
  ) {
    try {
      const refund = await this.provider.refund(
        gatewayPaymentId,
        amountInPaise,
      );
      await this.prisma.order.update({
        where: { id: orderId },
        data: { refundId: refund.refundId, refundedAt: new Date() },
      });
      await this.notifications.create(
        buyerId,
        'PAYMENT_REFUNDED',
        `Your payment for order ${orderId.slice(-6).toUpperCase()} was refunded — ${reason}.`,
      );
    } catch (err) {
      this.logger.error(
        `Refund failed for order ${orderId}, payment ${gatewayPaymentId} — needs manual refund`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
