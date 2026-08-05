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
  AdminOrderDetail,
  CancelOrderInput,
  CreateOrderInput,
  Order,
  ShippingAddress,
  UpdateOrderStatusInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { PayoutsService } from '../payouts/payouts.service';
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
    private readonly settings: SettingsService,
    private readonly payouts: PayoutsService,
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
          orderNumber: await this.nextOrderNumber(tx),
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

  /**
   * Atomically claims the next `NM-YYYYMMDD-NNN` number for today (UTC),
   * via a raw upsert — `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` is a
   * single atomic statement, so two concurrent checkouts on the same day can
   * never be handed the same count (unlike a naive count()+1 read-then-write).
   * Must run inside the same transaction as the order it numbers.
   */
  private async nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rows = await tx.$queryRaw<{ count: number }[]>`
      INSERT INTO "DailyOrderSequence" ("date", "count")
      VALUES (${day}, 1)
      ON CONFLICT ("date") DO UPDATE SET "count" = "DailyOrderSequence"."count" + 1
      RETURNING "count"
    `;
    return `NM-${day}-${String(rows[0].count).padStart(3, '0')}`;
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
   * Buyer-initiated cancellation. Only from PENDING/PAID and within the
   * admin-configured cutoff window — once a seller has generated a shipping
   * label (let alone shipped), the item is already in motion and
   * cancellation has to go through support instead. A PENDING order holds
   * its listings RESERVED (see create()); a PAID order has flipped them to
   * SOLD. Either way we release only listings this order is still the
   * recorded `holdOrderId` for — never another order's claim, even if it
   * happens to point at the same listing (e.g. this order lost the checkout
   * race and its hold already expired, or the listing has since been
   * re-sold to someone else). A PAID cancellation also refunds the captured
   * payment (per the policy's refund %); seller notification only fires for
   * a PAID cancellation, since only then did the seller get an ITEM_SOLD
   * notice in the first place.
   */
  async cancel(
    buyerId: string,
    id: string,
    input: CancelOrderInput,
  ): Promise<Order> {
    const policy = await this.settings.getCancellationPolicy();
    if (!policy.reasonCodes.includes(input.reason)) {
      throw new BadRequestException('Not a valid cancellation reason');
    }

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

      const hoursSincePlaced =
        (Date.now() - order.createdAt.getTime()) / (60 * 60 * 1000);
      if (hoursSincePlaced > policy.cutoffHours) {
        throw new BadRequestException(
          `Orders can only be cancelled within ${policy.cutoffHours} hours of being placed — contact support for help`,
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

      return this.cancelWithinTx(tx, order, 'buyer', input.reason);
    });

    return this.finishStatusChange(result, buyerId, policy.refundPercentage);
  }

  /**
   * Buyer confirms the parcel arrived. Previously DELIVERED was reachable
   * only by an admin editing each order by hand, which doesn't survive any
   * real volume — and it gates the seller's payout, so leaving it to an admin
   * meant sellers waited on admin data entry to get paid.
   *
   * Only the buyer's own SHIPPED order can move, and the same side effects
   * run as the admin path: shipments cascade to DELIVERED and the seller's
   * payout leaves hold.
   */
  async confirmDelivery(buyerId: string, id: string): Promise<Order> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: withItems,
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.buyerId !== buyerId) throw new ForbiddenException();
      if (order.status !== 'SHIPPED') {
        throw new BadRequestException(
          order.status === 'DELIVERED'
            ? 'This order is already marked delivered'
            : 'This order has not shipped yet',
        );
      }

      await tx.shipment.updateMany({
        where: { orderId: id },
        data: { status: 'DELIVERED' },
      });
      await this.payouts.markPayableForOrder(tx, id);

      for (const item of order.items) {
        await this.notifications.create(
          item.sellerId,
          'ITEM_SOLD',
          `The buyer confirmed delivery of "${item.listingTitle}". Your payout is now due.`,
          item.listingId,
          order.id,
          tx,
        );
      }

      return tx.order.update({
        where: { id },
        data: { status: 'DELIVERED' },
        include: withItems,
      });
    });

    return toOrderDto(updated);
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
    reason: string,
  ): Promise<{ updated: OrderRow; wasPaid: boolean }> {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', cancellationReason: reason },
      include: withItems,
    });

    // The items go back to their sellers unsold, so nothing is owed on them.
    await this.payouts.cancelForOrder(tx, order.id);

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
            ? `The order for "${item.listingTitle}" was cancelled by the buyer (${reason}).`
            : `The order for "${item.listingTitle}" was cancelled by an admin (${reason}).`,
          item.listingId,
          order.id,
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
    refundPercentage: number,
  ): Promise<Order> {
    if (result.wasPaid && result.updated.razorpayPaymentId) {
      await this.refundCancelledOrder(
        result.updated.id,
        result.updated.orderNumber,
        buyerId,
        result.updated.razorpayPaymentId,
        result.updated.totalInPaise,
        refundPercentage,
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
   * Best-effort refund for a buyer-cancelled PAID order, scaled by the
   * cancellation policy's refund %. Failure is logged for manual follow-up
   * rather than thrown — the cancellation itself has already committed by
   * the time this runs. A 0% policy skips the gateway call entirely (a
   * refund of nothing isn't a real gateway operation) but still tells the
   * buyer why no money is coming back.
   */
  private async refundCancelledOrder(
    orderId: string,
    orderNumber: string,
    buyerId: string,
    gatewayPaymentId: string,
    totalInPaise: number,
    refundPercentage: number,
  ) {
    const refundAmount = Math.round((totalInPaise * refundPercentage) / 100);
    if (refundAmount <= 0) {
      await this.notifications.create(
        buyerId,
        'PAYMENT_REFUNDED',
        `Order ${orderNumber} was cancelled. Per the current cancellation policy, this cancellation isn't eligible for a refund.`,
        null,
        orderId,
      );
      return;
    }
    try {
      const refund = await this.paymentProvider.refund(
        gatewayPaymentId,
        refundAmount,
      );
      await this.prisma.order.update({
        where: { id: orderId },
        data: { refundId: refund.refundId, refundedAt: new Date() },
      });
      await this.notifications.create(
        buyerId,
        'PAYMENT_REFUNDED',
        refundPercentage < 100
          ? `${refundPercentage}% of your payment for order ${orderNumber} was refunded after cancellation.`
          : `Your payment for order ${orderNumber} was refunded after cancellation.`,
        null,
        orderId,
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

  /** Full detail for the admin order-detail view — a plain Order DTO plus
   * buyer contact, gateway/refund ids, and per-seller shipment status. */
  async getAdminDetail(id: string): Promise<AdminOrderDetail> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        buyer: {
          select: { id: true, name: true, email: true, whatsappNumber: true },
        },
        shipments: true,
      },
    });
    if (!row) throw new NotFoundException('Order not found');

    const sellerIds = [...new Set(row.items.map((item) => item.sellerId))];
    const sellers = await this.prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true },
    });

    return {
      ...toOrderDto(row),
      buyer: row.buyer,
      sellers,
      razorpayPaymentId: row.razorpayPaymentId,
      refundId: row.refundId,
      cancellationReason: row.cancellationReason,
      updatedAt: row.updatedAt.toISOString(),
      shipments: row.shipments.map((s) => ({
        sellerId: s.sellerId,
        status: s.status,
        courier: s.courier,
        trackingId: s.trackingId,
        shippedAt: s.shippedAt?.toISOString() ?? null,
      })),
    };
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
    let refundPercentage = 100;
    if (dto.status === 'CANCELLED') {
      const policy = await this.settings.getCancellationPolicy();
      if (!dto.reason || !policy.reasonCodes.includes(dto.reason)) {
        throw new BadRequestException('Not a valid cancellation reason');
      }
      refundPercentage = policy.refundPercentage;
    }

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
        return this.cancelWithinTx(tx, order, 'admin', dto.reason!);
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
            order.id,
            tx,
          );
        }
        await this.payouts.createForOrder(tx, order.id, order.items);
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
        // The buyer has the goods — the hold ends and the seller is now owed.
        await this.payouts.markPayableForOrder(tx, id);
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: dto.status },
        include: withItems,
      });
      return { updated, wasPaid: false };
    });

    return this.finishStatusChange(
      result,
      result.updated.buyerId,
      refundPercentage,
    );
  }
}

function toOrderDto(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
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
