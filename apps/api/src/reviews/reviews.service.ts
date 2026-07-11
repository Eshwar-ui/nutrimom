import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateReviewInput, Review } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';

// An order must have reached this point before its items can be reviewed —
// a buyer can't rate a seller for something that was never handed over.
const REVIEWABLE_ORDER_STATUSES = ['PAID', 'SHIPPED', 'DELIVERED'] as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    buyerId: string,
    orderId: string,
    input: CreateReviewInput,
  ): Promise<Review> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (!REVIEWABLE_ORDER_STATUSES.includes(order.status as never)) {
      throw new BadRequestException('This order can\'t be reviewed yet');
    }

    const item = order.items.find((i) => i.listingId === input.listingId);
    if (!item) {
      throw new BadRequestException('That item is not part of this order');
    }

    try {
      const row = await this.prisma.review.create({
        data: {
          orderId,
          listingId: input.listingId,
          reviewerId: buyerId,
          sellerId: item.sellerId,
          rating: input.rating,
          comment: input.comment || null,
        },
      });
      return this.toDto(row, item.listingTitle, undefined);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('You already reviewed this item');
      }
      throw err;
    }
  }

  async listForSeller(sellerId: string): Promise<Review[]> {
    const rows = await this.prisma.review.findMany({
      where: { sellerId },
      include: { listing: { select: { title: true } }, reviewer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) =>
      this.toDto(r, r.listing.title, r.reviewer.name),
    );
  }

  async summaryForSeller(
    sellerId: string,
  ): Promise<{ averageRating: number | null; reviewCount: number }> {
    const agg = await this.prisma.review.aggregate({
      where: { sellerId },
      _avg: { rating: true },
      _count: true,
    });
    return {
      averageRating: agg._avg.rating,
      reviewCount: agg._count,
    };
  }

  private toDto(
    row: { id: string; orderId: string; listingId: string; rating: number; comment: string | null; createdAt: Date },
    listingTitle: string,
    reviewerName: string | undefined,
  ): Review {
    return {
      id: row.id,
      orderId: row.orderId,
      listingId: row.listingId,
      listingTitle,
      reviewerName: reviewerName ?? '',
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
