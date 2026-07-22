import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateOrderInput,
  Order,
  ShippingAddress,
  UpdateOrderStatusInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../payments/payment-provider.interface';

const withItems = { items: true } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof withItems }>;

// A buyer can still back out before the item has shipped; once it's on its
// way, cancellation has to go through the seller/admin instead.
const CANCELLABLE_STATUSES = ['PENDING', 'PAID'] as const;

// Legal admin transitions. Every path that reaches CANCELLED or PAID has
// side effects (release/refund, or claim + notify) — see updateStatus().
const ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

// How long a PENDING order's claim on a listing survives before the
// reservation sweeper releases it back to APPROVED. Comfortably longer than
// a normal Razorpay checkout.
const HOLD_MINUTES = 30;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  /**
   * Create a PENDING order from a set of listings. Prices come from the DB and
   * availability is re-checked here — a cart can hold stale items.
   *
   * Payment is ONLINE-only. Each listing is atomically claimed (APPROVED →
   * RESERVED, tied to this order via `holdOrderId`) as part of the same
   * transaction that creates the order — the conditional UPDATE re-checks
   * status against committed data, so a second buyer racing to check out the
   * same item always loses the claim instead of both orders reaching PAID.
   * An abandoned hold is released by the reservation sweeper after
   * `HOLD_MINUTES`; a paid hold is flipped to SOLD by PaymentsService.settle.
   */
  async create(buyerId: string, input: CreateOrderInput): Promise<Order> {
    const ids = [...new Set(input.listingIds)];

    return this.prisma.$transaction(async (tx) => {
      const listings = await tx.listing.findMany({
        where: { id: { in: ids } },
      });

      if (listings.length !== ids.length) {
        throw new BadRequestException(
          'One or more items are no longer available',
        );
      }
      for (const l of listings) {
        if (l.status !== 'APPROVED') {
          throw new BadRequestException(`"${l.title}" is no longer available`);
        }
        if (l.sellerId === buyerId) {
          throw new BadRequestException("You can't buy your own listing");
        }
      }

      const totalInPaise = listings.reduce(
        (sum, l) => sum + l.sellingPriceInPaise,
        0,
      );

      const order = await tx.order.create({
        data: {
          buyerId,
          status: 'PENDING',
          paymentMethod: 'ONLINE',
          totalInPaise,
          shippingAddress: input.shippingAddress,
          items: {
            create: listings.map((l) => ({
              listingId: l.id,
              listingTitle: l.title,
              sellerId: l.sellerId,
              unitPriceInPaise: l.sellingPriceInPaise,
              image: l.images[0] ?? null,
            })),
          },
        },
        include: withItems,
      });

      const reservedUntil = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
      for (const l of listings) {
        const claimed = await tx.listing.updateMany({
          where: { id: l.id, status: 'APPROVED' },
          data: {
            status: 'RESERVED',
            reservedById: buyerId,
            reservedUntil,
            holdOrderId: order.id,
          },
        });
        if (claimed.count === 0) {
          // Lost the race — someone else's order claimed it between our read
          // above and now. Throwing here rolls back the whole transaction,
          // including the order and every other listing's claim.
          throw new BadRequestException(`"${l.title}" is no longer available`);
        }
      }

      return toOrderDto(order);
    });
  }

  async listMine(buyerId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { buyerId },
      include: withItems,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrderDto);
  }

  async getMine(buyerId: string, id: string): Promise<Order> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: withItems,
    });
    if (!row) throw new NotFoundException('Order not found');
    if (row.buyerId !== buyerId) throw new ForbiddenException();
    return toOrderDto(row);
  }

  /**
   * Buyer-initiated cancellation. Only from PENDING/PAID — once a seller has
   * generated a shipping label (let alone shipped), the item is already in
   * motion and cancellation has to go through support instead. A PENDING
   * order holds its listings RESERVED (see create()); a PAID order has
   * flipped them to SOLD. Either way we release only listings this order is
   * still the recorded `holdOrderId` for — never another order's claim, even
   * if it happens to point at the same listing (e.g. this order lost the
   * checkout race and its hold already expired, or the listing has since
   * been re-sold to someone else). A PAID cancellation also refunds the
   * captured payment; seller notification only fires for a PAID
   * cancellation, since only then did the seller get an ITEM_SOLD notice in
   * the first place.
   */
  async cancel(buyerId: string, id: string): Promise<Order> {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: withItems,
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.buyerId !== buyerId) throw new ForbiddenException();
      if (!CANCELLABLE_STATUSES.includes(order.status as never)) {
        throw new BadRequestException(
          'This order has already shipped and can no longer be cancelled',
        );
      }

      const shipmentCount = await tx.shipment.count({
        where: { orderId: id },
      });
      if (shipmentCount > 0) {
        throw new BadRequestException(
          'A seller has already started fulfilling this order — contact support to cancel',
        );
      }

      return this.cancelWithinTx(tx, order, 'buyer');
    });

    return this.finishStatusChange(result, buyerId);
  }

  /**
   * Shared cancel body for both buyer- and admin-initiated cancellation:
   * flip the order to CANCELLED and release only the listings this order is
   * still the recorded `holdOrderId` for (never another order's claim, even
   * if it happens to point at the same listing). Seller notification only
   * fires when the order was PAID, since only then did the seller get an
   * ITEM_SOLD notice in the first place. Refunding is the caller's job —
   * this runs inside the DB transaction and the gateway call can't.
   */
  private async cancelWithinTx(
    tx: Prisma.TransactionClient,
    order: OrderRow,
    cancelledBy: 'buyer' | 'admin',
  ): Promise<{ updated: OrderRow; wasPaid: boolean }> {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
      include: withItems,
    });

    for (const item of order.items) {
      const released = await tx.listing.updateMany({
        where: {
          id: item.listingId,
          holdOrderId: order.id,
          status: { in: ['RESERVED', 'SOLD'] },
        },
        data: {
          status: 'APPROVED',
          holdOrderId: null,
          reservedById: null,
          reservedUntil: null,
        },
      });
      if (released.count > 0 && order.status === 'PAID') {
        await this.notifications.create(
          item.sellerId,
          'ORDER_CANCELLED',
          cancelledBy === 'buyer'
            ? `The order for "${item.listingTitle}" was cancelled by the buyer.`
            : `The order for "${item.listingTitle}" was cancelled by an admin.`,
          item.listingId,
          tx,
        );
      }
    }

    return { updated, wasPaid: order.status === 'PAID' };
  }

  /** Issues the refund (if any) after a cancellation transaction commits. */
  private async finishStatusChange(
    result: { updated: OrderRow; wasPaid: boolean },
    buyerId: string,
  ): Promise<Order> {
    if (result.wasPaid && result.updated.razorpayPaymentId) {
      await this.refundCancelledOrder(
        result.updated.id,
        buyerId,
        result.updated.razorpayPaymentId,
        result.updated.totalInPaise,
      );
      const refreshed = await this.prisma.order.findUnique({
        where: { id: result.updated.id },
        include: withItems,
      });
      if (refreshed) return toOrderDto(refreshed);
    }
    return toOrderDto(result.updated);
  }

  /**
   * Best-effort refund for a buyer-cancelled PAID order. Failure is logged
   * for manual follow-up rather than thrown — the cancellation itself has
   * already committed by the time this runs.
   */
  private async refundCancelledOrder(
    orderId: string,
    buyerId: string,
    gatewayPaymentId: string,
    amountInPaise: number,
  ) {
    try {
      const refund = await this.paymentProvider.refund(
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
        `Your payment for order ${orderId.slice(-6).toUpperCase()} was refunded after cancellation.`,
      );
    } catch (err) {
      this.logger.error(
        `Refund failed for cancelled order ${orderId}, payment ${gatewayPaymentId} — needs manual refund`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  // ---- Admin ----

  async adminList(): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      include: withItems,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrderDto);
  }

  /**
   * Admin manual override. Only follows the legal transitions in
   * ORDER_TRANSITIONS — never an arbitrary jump — because every status
   * change has to keep listings, shipments, and (for a PAID cancellation)
   * the captured payment in sync with it. CANCELLED reuses the same
   * release/refund path as buyer cancel(); PAID (a manual settlement
   * override, e.g. reconciling a payment the webhook missed) claims each
   * listing the same way PaymentsService.settle() does and refuses if any
   * has lost its hold; DELIVERED cascades down to this order's shipments so
   * that status isn't otherwise unreachable.
   */
  async updateStatus(id: string, dto: UpdateOrderStatusInput): Promise<Order> {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: withItems,
      });
      if (!order) throw new NotFoundException('Order not found');

      const allowed = ORDER_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot move an order from ${order.status} to ${dto.status}`,
        );
      }

      if (dto.status === 'CANCELLED') {
        return this.cancelWithinTx(tx, order, 'admin');
      }

      if (dto.status === 'PAID') {
        for (const item of order.items) {
          const claimed = await tx.listing.updateMany({
            where: { id: item.listingId, holdOrderId: order.id },
            data: { status: 'SOLD', reservedUntil: null },
          });
          if (claimed.count === 0) {
            throw new BadRequestException(
              `"${item.listingTitle}" is no longer held by this order and can't be marked sold`,
            );
          }
          await this.notifications.create(
            item.sellerId,
            'ITEM_SOLD',
            `Your item "${item.listingTitle}" has sold. Please arrange handover.`,
            item.listingId,
            tx,
          );
        }
        const updated = await tx.order.update({
          where: { id },
          data: { status: 'PAID' },
          include: withItems,
        });
        return { updated, wasPaid: false };
      }

      if (dto.status === 'DELIVERED') {
        await tx.shipment.updateMany({
          where: { orderId: id },
          data: { status: 'DELIVERED' },
        });
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: dto.status },
        include: withItems,
      });
      return { updated, wasPaid: false };
    });

    return this.finishStatusChange(result, result.updated.buyerId);
  }
}

function toOrderDto(row: OrderRow): Order {
  return {
    id: row.id,
    status: row.status,
    paymentMethod: row.paymentMethod,
    totalInPaise: row.totalInPaise,
    shippingAddress: row.shippingAddress as unknown as ShippingAddress,
    razorpayOrderId: row.razorpayOrderId,
    refundedAt: row.refundedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      id: item.id,
      listingId: item.listingId,
      listingTitle: item.listingTitle,
      image: item.image,
      unitPriceInPaise: item.unitPriceInPaise,
      sellerId: item.sellerId,
    })),
  };
}
