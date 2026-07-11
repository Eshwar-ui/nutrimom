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
   * availability is re-checked here — a cart can hold stale items. Listings are
   * NOT marked sold yet; that happens on payment settlement.
   */
  async create(buyerId: string, input: CreateOrderInput): Promise<Order> {
    const ids = [...new Set(input.listingIds)];
    const listings = await this.prisma.listing.findMany({
      where: { id: { in: ids } },
    });

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

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        status: 'PENDING',
        totalInPaise,
        shippingAddress:
          input.shippingAddress as unknown as Prisma.InputJsonValue,
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
    return toOrderDto(order);
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
   * item has already left the seller's hands. If the order was PAID, any
   * listing this order marked SOLD is released back to APPROVED so it can
   * be bought again.
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

      const wasPaid = order.status === 'PAID';
      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: withItems,
      });

      if (wasPaid) {
        for (const item of order.items) {
          await tx.listing.updateMany({
            where: { id: item.listingId, status: 'SOLD' },
            data: { status: 'APPROVED' },
          });
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
    status: row.status as OrderStatus,
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
