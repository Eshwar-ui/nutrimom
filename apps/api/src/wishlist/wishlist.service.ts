import { Injectable, NotFoundException } from '@nestjs/common';
import type { Listing } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toListingDto, withRefs } from '../listings/listings.service';

/** P2003 — the listing this row points at doesn't exist. */
function isMissingListing(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2003'
  );
}

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
    // A listing id from the client can be stale — the item may have been
    // deleted or taken down while the shop page sat open. Letting the insert
    // hit the foreign key raised an unhandled 500 and reported a routine
    // client-staleness case as a server fault. Caught rather than pre-checked
    // so the same answer holds when the listing disappears mid-request.
    await this.prisma.wishlistItem
      .create({ data: { userId, listingId } })
      .catch((err: unknown) => {
        if (isMissingListing(err)) {
          throw new NotFoundException('That item is no longer available');
        }
        throw err;
      });
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
