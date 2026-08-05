import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  splitPayout,
  type AdminPayout,
  type MarkPayoutPaidInput,
  type PayoutStatus,
  type SellerPayout,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

type PayoutRow = Prisma.SellerPayoutGetPayload<{
  include: { order: { select: { orderNumber: true } } };
}>;

// The order lines a payout is computed from — whatever the caller already has
// loaded, so this never re-queries inside a settle transaction.
type PayoutSourceItem = { sellerId: string; unitPriceInPaise: number };

/**
 * The seller payout ledger. Buyers pay the marketplace, not the seller, so
 * every paid order creates one row per seller recording exactly what is owed.
 * Nothing here moves money — India requires a route account / payout product
 * (Razorpay Route or a bank transfer) to actually pay a third party, so the
 * transfer itself is done out-of-band and recorded here with its reference.
 */
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Record what this order owes each of its sellers. Called from inside the
   * transaction that flips the order to PAID, so a settled sale can never
   * exist without its debt. Idempotent via the (orderId, sellerId) unique
   * constraint — verify and webhook can both reach settle for one order.
   */
  async createForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    items: PayoutSourceItem[],
  ): Promise<void> {
    const { commissionBps } = await this.settings.getPayoutPolicy(tx);

    const grossBySeller = new Map<string, number>();
    for (const item of items) {
      grossBySeller.set(
        item.sellerId,
        (grossBySeller.get(item.sellerId) ?? 0) + item.unitPriceInPaise,
      );
    }

    for (const [sellerId, grossInPaise] of grossBySeller) {
      const { commissionInPaise, netInPaise } = splitPayout(
        grossInPaise,
        commissionBps,
      );
      await tx.sellerPayout.upsert({
        where: { orderId_sellerId: { orderId, sellerId } },
        create: {
          orderId,
          sellerId,
          grossInPaise,
          commissionBps,
          commissionInPaise,
          netInPaise,
        },
        // A re-settle must not restate an existing debt — especially not one
        // an admin has already paid out.
        update: {},
      });
    }
  }

  /**
   * The order was cancelled, so the item went back to the seller unsold and
   * nothing is owed. Never touches a payout already marked PAID — that money
   * has left the building and needs a human to claw it back.
   */
  async cancelForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const paidOut = await tx.sellerPayout.count({
      where: { orderId, status: 'PAID' },
    });
    if (paidOut > 0) {
      this.logger.warn(
        `Order ${orderId} was cancelled after ${paidOut} payout(s) had already been paid out — needs manual recovery from the seller`,
      );
    }
    await tx.sellerPayout.updateMany({
      where: { orderId, status: { in: ['PENDING', 'PAYABLE'] } },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * The buyer has the goods, so the hold ends and the marketplace now owes
   * the seller. Only PENDING moves — a cancelled payout stays cancelled.
   */
  async markPayableForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    await tx.sellerPayout.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'PAYABLE' },
    });
  }

  async listForSeller(sellerId: string): Promise<SellerPayout[]> {
    const rows = await this.prisma.sellerPayout.findMany({
      where: { sellerId },
      include: { order: { select: { orderNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map(toDto);
  }

  /** What a seller has been paid, is owed, and is still on hold. */
  async summaryForSeller(sellerId: string) {
    const grouped = await this.prisma.sellerPayout.groupBy({
      by: ['status'],
      where: { sellerId },
      _sum: { netInPaise: true },
    });
    const total = (status: PayoutStatus) =>
      grouped.find((g) => g.status === status)?._sum.netInPaise ?? 0;
    return {
      onHoldInPaise: total('PENDING'),
      payableInPaise: total('PAYABLE'),
      paidInPaise: total('PAID'),
    };
  }

  async listForAdmin(status?: PayoutStatus): Promise<AdminPayout[]> {
    const rows = await this.prisma.sellerPayout.findMany({
      where: status ? { status } : undefined,
      include: {
        order: { select: { orderNumber: true } },
        seller: {
          select: { id: true, name: true, email: true, whatsappNumber: true },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });

    // Only to show "3 items" against each queue row — the amounts come from
    // the payout snapshot itself and are never recomputed from these.
    const itemCounts = await this.prisma.orderItem.groupBy({
      by: ['orderId', 'sellerId'],
      where: { orderId: { in: rows.map((r) => r.orderId) } },
      _count: { _all: true },
    });
    const countOf = (orderId: string, sellerId: string) =>
      itemCounts.find((c) => c.orderId === orderId && c.sellerId === sellerId)
        ?._count._all ?? 0;

    return rows.map((row) => ({
      ...toDto(row),
      sellerId: row.seller.id,
      sellerName: row.seller.name,
      sellerEmail: row.seller.email,
      sellerWhatsapp: row.seller.whatsappNumber,
      itemCount: countOf(row.orderId, row.sellerId),
    }));
  }

  /**
   * Record an out-of-band transfer. Only a PAYABLE payout can be paid — money
   * must not leave against an order that is still cancellable or already
   * cancelled, and paying twice is what the status guard prevents.
   */
  async markPaid(id: string, dto: MarkPayoutPaidInput): Promise<SellerPayout> {
    const updated = await this.prisma.sellerPayout.updateMany({
      where: { id, status: 'PAYABLE' },
      data: { status: 'PAID', reference: dto.reference, paidAt: new Date() },
    });
    if (updated.count === 0) {
      const existing = await this.prisma.sellerPayout.findUnique({
        where: { id },
      });
      if (!existing) throw new BadRequestException('Payout not found');
      throw new BadRequestException(
        existing.status === 'PAID'
          ? 'This payout has already been paid'
          : `A ${existing.status.toLowerCase()} payout can't be paid out`,
      );
    }
    const row = await this.prisma.sellerPayout.findUniqueOrThrow({
      where: { id },
      include: { order: { select: { orderNumber: true } } },
    });
    return toDto(row);
  }
}

function toDto(row: PayoutRow): SellerPayout {
  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.order.orderNumber,
    status: row.status,
    grossInPaise: row.grossInPaise,
    commissionBps: row.commissionBps,
    commissionInPaise: row.commissionInPaise,
    netInPaise: row.netInPaise,
    reference: row.reference,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
