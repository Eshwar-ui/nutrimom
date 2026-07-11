import { Injectable } from '@nestjs/common';
import type { Listing } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toListingDto, withRefs } from '../listings/listings.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Listing[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: withRefs } },
    });
    return rows.map((r) => toListingDto(r.listing));
  }

  /** Add if absent, remove if present. Returns the resulting state. */
  async toggle(
    userId: string,
    listingId: string,
  ): Promise<{ wishlisted: boolean }> {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    }
    await this.prisma.wishlistItem.create({ data: { userId, listingId } });
    return { wishlisted: true };
  }

  async ids(userId: string): Promise<string[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return rows.map((r) => r.listingId);
  }
}
