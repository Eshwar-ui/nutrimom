import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Listing,
  ListingInput,
  ListingQuery,
  ListingUpdateInput,
  ModerateListingInput,
  Paginated,
  SellerContact,
  SellerProfile,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';

export const withRefs = {
  category: true,
  seller: {
    select: {
      id: true,
      name: true,
      city: true,
      whatsappNumber: true,
      isSellerVerified: true,
    },
  },
} satisfies Prisma.ListingInclude;
type ListingRow = Prisma.ListingGetPayload<{ include: typeof withRefs }>;

// Statuses a buyer is allowed to see on a detail page.
const PUBLIC_STATUSES = ['APPROVED', 'RESERVED', 'SOLD'] as const;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
  ) {}

  async browse(query: ListingQuery): Promise<Paginated<Listing>> {
    const where: Prisma.ListingWhereInput = { status: 'APPROVED' };
    if (query.category) where.category = { slug: query.category };
    if (query.condition) where.condition = query.condition;
    if (query.delivery) where.deliveryOption = query.delivery;
    if (query.featured) where.isFeatured = true;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.search)
      where.title = { contains: query.search, mode: 'insensitive' };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.sellingPriceInPaise = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      query.sort === 'price-asc'
        ? { sellingPriceInPaise: 'asc' }
        : query.sort === 'price-desc'
          ? { sellingPriceInPaise: 'desc' }
          : { createdAt: 'desc' };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        include: withRefs,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: rows.map(toListingDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  /**
   * Listing detail. Public callers only ever see live listings, but an admin
   * has to be able to open a PENDING one to review it (that's the whole point
   * of moderation), and a seller has to be able to preview their own before
   * it's approved. Both are identified by the optional JWT on this route.
   */
  async getPublic(id: string, viewer?: RequestUser): Promise<Listing> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      include: withRefs,
    });
    if (!row) throw new NotFoundException('Listing not found');

    const isAdmin = viewer?.role === 'ADMIN';
    const isOwner = !!viewer && row.sellerId === viewer.id;
    if (
      !isAdmin &&
      !isOwner &&
      !PUBLIC_STATUSES.includes(row.status as never)
    ) {
      throw new NotFoundException('Listing not found');
    }
    return toListingDto(row);
  }

  /** The seller's WhatsApp number — gated behind auth, unlike getPublic(). */
  async getContact(id: string): Promise<SellerContact> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      select: {
        status: true,
        seller: { select: { whatsappNumber: true } },
      },
    });
    if (!row || !PUBLIC_STATUSES.includes(row.status as never)) {
      throw new NotFoundException('Listing not found');
    }
    return { whatsappNumber: row.seller.whatsappNumber };
  }

  async sellerProfile(sellerId: string): Promise<SellerProfile> {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    const [rows, ratingAgg] = await Promise.all([
      this.prisma.listing.findMany({
        where: { sellerId, status: 'APPROVED' },
        include: withRefs,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.aggregate({
        where: { sellerId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    return {
      id: seller.id,
      name: seller.name,
      city: seller.city,
      bio: seller.bio,
      isSellerVerified: seller.isSellerVerified,
      memberSince: seller.createdAt.toISOString(),
      listings: rows.map(toListingDto),
      averageRating: ratingAgg._avg.rating,
      reviewCount: ratingAgg._count,
    };
  }

  // ---- Seller (owner) ----

  async listMine(userId: string): Promise<Listing[]> {
    const rows = await this.prisma.listing.findMany({
      where: { sellerId: userId },
      include: withRefs,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toListingDto);
  }

  /** Lightweight seller dashboard numbers — built from data that already exists. */
  async sellerStats(userId: string): Promise<{
    pending: number;
    approved: number;
    sold: number;
    rejected: number;
    totalRevenueInPaise: number;
  }> {
    const [pending, approved, sold, rejected, revenue] = await Promise.all([
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'PENDING' },
      }),
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'APPROVED' },
      }),
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'SOLD' },
      }),
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'REJECTED' },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          sellerId: userId,
          order: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
        },
        _sum: { unitPriceInPaise: true },
      }),
    ]);
    return {
      pending,
      approved,
      sold,
      rejected,
      totalRevenueInPaise: revenue._sum.unitPriceInPaise ?? 0,
    };
  }

  async create(userId: string, input: ListingInput): Promise<Listing> {
    await this.assertCanList(userId);
    await this.assertCategory(input.categoryId);
    // A seller's contact travels with their profile; capture it on first sell.
    if (input.whatsappNumber) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { whatsappNumber: input.whatsappNumber, city: input.city },
      });
    }
    const row = await this.prisma.listing.create({
      data: {
        sellerId: userId,
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        condition: input.condition,
        originalPriceInPaise: input.originalPriceInPaise ?? null,
        sellingPriceInPaise: input.sellingPriceInPaise,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        usageDuration: input.usageDuration || null,
        reasonForSelling: input.reasonForSelling || null,
        city: input.city,
        deliveryOption: input.deliveryOption,
        images: input.images,
        status: 'PENDING',
      },
      include: withRefs,
    });
    return toListingDto(row);
  }

  async update(
    userId: string,
    id: string,
    input: ListingUpdateInput,
  ): Promise<Listing> {
    const existing = await this.owned(userId, id);
    if (existing.status === 'SOLD') {
      throw new BadRequestException('Sold listings cannot be edited');
    }
    if (input.categoryId) await this.assertCategory(input.categoryId);
    const row = await this.prisma.listing.update({
      where: { id },
      data: {
        ...input,
        usageDuration: input.usageDuration ?? undefined,
        reasonForSelling: input.reasonForSelling ?? undefined,
        // Any edit to a listing that's already been reviewed sends it back
        // into the queue — otherwise a seller could get a listing approved
        // once and then freely swap in different photos/price/description
        // with no further review.
        status:
          existing.status === 'REJECTED' || existing.status === 'APPROVED'
            ? 'PENDING'
            : existing.status,
        rejectionReason: null,
      },
      include: withRefs,
    });
    return toListingDto(row);
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    const existing = await this.owned(userId, id);
    try {
      await this.prisma.listing.delete({ where: { id } });
    } catch {
      throw new BadRequestException(
        'This listing is part of an order and cannot be deleted',
      );
    }
    // Listing is gone from the DB; free its images best-effort (never throws).
    await this.storage.removeByUrls(existing.images);
    return { id };
  }

  // ---- Admin ----

  async adminList(status?: string): Promise<Listing[]> {
    const rows = await this.prisma.listing.findMany({
      where: status ? { status: status as never } : {},
      include: withRefs,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toListingDto);
  }

  // Moderation only ever applies to a listing awaiting review — approving or
  // rejecting a RESERVED/SOLD listing would put an already-purchased item
  // back in the browse pool out from under its buyer.
  async moderate(id: string, dto: ModerateListingInput): Promise<Listing> {
    const { count } = await this.prisma.listing.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: dto.status,
        rejectionReason: dto.status === 'REJECTED' ? dto.reason : null,
      },
    });
    if (count === 0) {
      const existing = await this.prisma.listing.findUnique({
        where: { id },
      });
      if (!existing) throw new NotFoundException('Listing not found');
      throw new BadRequestException(
        'This listing is no longer awaiting review',
      );
    }
    const row = await this.prisma.listing.findUniqueOrThrow({
      where: { id },
      include: withRefs,
    });
    await this.notifications.create(
      row.sellerId,
      dto.status === 'APPROVED' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      dto.status === 'APPROVED'
        ? `Your listing "${row.title}" is now live.`
        : `Your listing "${row.title}" wasn't approved: ${dto.reason}`,
      row.id,
    );
    return toListingDto(row);
  }

  /**
   * Admin-authored listing (roadmap 4.1) — attributed to the built-in
   * "Marketplace" system seller and auto-approved (an admin creating it
   * *is* the review), unlike a real seller's submission which always
   * starts PENDING via create().
   */
  async adminCreate(input: ListingInput): Promise<Listing> {
    const marketplaceId = await this.marketplaceSellerId();
    const created = await this.create(marketplaceId, input);
    const row = await this.prisma.listing.update({
      where: { id: created.id },
      data: { status: 'APPROVED' },
      include: withRefs,
    });
    return toListingDto(row);
  }

  /** Admin-only category reassignment — bypasses owner checks entirely,
   * unlike the seller's own update() which is scoped to their listings. */
  async adminUpdateCategory(id: string, categoryId: string): Promise<Listing> {
    await this.assertCategory(categoryId);
    try {
      const row = await this.prisma.listing.update({
        where: { id },
        data: { categoryId },
        include: withRefs,
      });
      return toListingDto(row);
    } catch {
      throw new NotFoundException('Listing not found');
    }
  }

  private async marketplaceSellerId(): Promise<string> {
    const marketplace = await this.prisma.user.findFirst({
      where: { isSystemSeller: true },
      select: { id: true },
    });
    if (!marketplace) {
      throw new InternalServerErrorException(
        'Marketplace system seller is not seeded — run prisma db seed',
      );
    }
    return marketplace.id;
  }

  async setFeatured(id: string, isFeatured: boolean): Promise<Listing> {
    try {
      const row = await this.prisma.listing.update({
        where: { id },
        data: { isFeatured },
        include: withRefs,
      });
      return toListingDto(row);
    } catch {
      throw new NotFoundException('Listing not found');
    }
  }

  private async owned(userId: string, id: string) {
    const row = await this.prisma.listing.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Listing not found');
    if (row.sellerId !== userId) throw new ForbiddenException();
    return row;
  }

  // Monetization + trust gate: a seller may create a listing only once
  // verified (paid registration AND admin-approved — see the merged
  // pipeline in SellerBillingService.status) AND holding an active
  // membership window. Enforced here (server-side), not just in the UI.
  private async assertCanList(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { registrationPaidAt: true, isSellerVerified: true },
    });
    if (!user?.registrationPaidAt || !user.isSellerVerified) {
      throw new ForbiddenException(
        'Your seller account must be verified — registered and approved by an admin — before you can list items.',
      );
    }

    const active = await this.prisma.sellerMembership.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!active) {
      throw new ForbiddenException(
        'An active membership is required to list items. Please subscribe to a plan.',
      );
    }
  }

  private async assertCategory(categoryId: string) {
    const exists = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Category not found');
  }
}

export function toListingDto(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    condition: row.condition,
    originalPriceInPaise: row.originalPriceInPaise,
    sellingPriceInPaise: row.sellingPriceInPaise,
    purchaseDate: row.purchaseDate ? row.purchaseDate.toISOString() : null,
    usageDuration: row.usageDuration,
    reasonForSelling: row.reasonForSelling,
    city: row.city,
    deliveryOption: row.deliveryOption,
    images: row.images,
    status: row.status,
    rejectionReason: row.rejectionReason,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt.toISOString(),
    category: {
      id: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
    },
    seller: {
      id: row.seller.id,
      name: row.seller.name,
      city: row.seller.city,
      hasWhatsapp: !!row.seller.whatsappNumber,
      isSellerVerified: row.seller.isSellerVerified,
    },
  };
}
