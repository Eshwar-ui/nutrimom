import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateOrderInput,
  Order,
  OrderStatus,
  PaymentMethod,
  ShippingAddress,
  UpdateOrderStatusInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const withItems = { items: true } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof withItems }>;

// A buyer can still back out before the item has shipped; once it's on its
// way, cancellation has to go through the seller/admin instead.
const CANCELLABLE_STATUSES = ['PENDING', 'PAID'] as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Create a PENDING order from a set of listings. Prices come from the DB and
   * availability is re-checked here — a cart can hold stale items.
   *
   * Cash on Delivery (the active method) has no payment gate, so the order is
   * confirmed immediately: the listings are reserved (marked SOLD) and the
   * seller/admin are notified right away. For ONLINE orders that settlement is
   * deferred until payment is verified (see PaymentsService.settle).
   */
  async create(buyerId: string, input: CreateOrderInput): Promise<Order> {
    const ids = [...new Set(input.listingIds)];
    const paymentMethod: PaymentMethod = input.paymentMethod;

    return this.prisma.$transaction(async (tx) => {
      const listings = await tx.listing.findMany({ where: { id: { in: ids } } });

      if (listings.length !== ids.length) {
        throw new BadRequestException('One or more items are no longer available');
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
          paymentMethod,
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

      if (paymentMethod === 'COD') {
        // Reserve each item and notify — the same side effects an online
        // payment triggers on settlement, but at placement time.
        for (const l of listings) {
          const reserved = await tx.listing.updateMany({
            where: { id: l.id, status: 'APPROVED' },
            data: { status: 'SOLD' },
          });
          // Another cart won the item between the check above and now.
          if (reserved.count === 0) {
            throw new BadRequestException(`"${l.title}" was just taken`);
          }
          await this.notifications.create(
            l.sellerId,
            'ITEM_SOLD',
            `Your item "${l.title}" has sold (Cash on Delivery). Please arrange handover.`,
            l.id,
            tx,
          );
        }
        await this.notifications.notifyAdmins(
          'ORDER_PLACED',
          `New COD order ${order.id.slice(-6).toUpperCase()} — ${order.items.length} item(s).`,
          null,
          tx,
        );
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
   * Buyer-initiated cancellation. Only from PENDING/PAID — once shipped, the
   * item has already left the seller's hands. Any listing this order had
   * reserved (marked SOLD — true for paid online orders and for every COD
   * order) is released back to APPROVED so it can be bought again, and its
   * seller is notified.
   */
  async cancel(buyerId: string, id: string): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
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

      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: withItems,
      });

      for (const item of order.items) {
        // Only notify the seller if this order actually held the item; an
        // unpaid ONLINE order never reserved it, so nothing is released.
        const released = await tx.listing.updateMany({
          where: { id: item.listingId, status: 'SOLD' },
          data: { status: 'APPROVED' },
        });
        if (released.count > 0) {
          await this.notifications.create(
            item.sellerId,
            'ORDER_CANCELLED',
            `The order for "${item.listingTitle}" was cancelled by the buyer.`,
            item.listingId,
            tx,
          );
        }
      }

      return toOrderDto(updated);
    });
  }

  // ---- Admin ----

  async adminList(): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      include: withItems,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrderDto);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusInput): Promise<Order> {
    try {
      const row = await this.prisma.order.update({
        where: { id },
        data: { status: dto.status },
        include: withItems,
      });
      return toOrderDto(row);
    } catch {
      throw new NotFoundException('Order not found');
    }
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
