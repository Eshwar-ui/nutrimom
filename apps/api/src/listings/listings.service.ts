import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Listing as ListingRecord } from '@prisma/client';
import { normaliseCity } from '@nutrimom/shared';
import type {
  Listing,
  ListingInput,
  ListingLocations,
  ListingQuery,
  ListingUpdateInput,
  ModerateListingInput,
  OwnerListing,
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

// Statuses that count as "has listings here" for GET /listings/locations: on
// the market now, or held for a buyer and likely back on it if they don't pay.
const LIVE_STATUSES = ['APPROVED', 'RESERVED'] as const;

/**
 * Fields a seller may change on a live listing without sending it back to
 * moderation — see update().
 */
const LOCATION_FIELDS: ReadonlySet<string> = new Set([
  'city',
  'locality',
  'pincode',
  'deliveryOption',
]);

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
    // Exact (case-insensitive) rather than contains: "Delhi" must not also
    // return "New Delhi". Matches both the spelling given and its canonical
    // form, so "Bangalore" finds listings saved as "Bengaluru" and any legacy
    // rows saved before city names were normalised.
    if (query.city?.trim()) Object.assign(where, cityWhere(query.city));
    if (query.locality?.trim())
      where.locality = { contains: query.locality.trim(), mode: 'insensitive' };
    if (query.pincode) where.pincode = query.pincode;
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
   * Where live listings are, to feed the city picker (cities with listings
   * first, with counts) and, for a chosen city, locality suggestions.
   * Grouped case-insensitively — "Koramangala" and "koramangala " are one
   * place — and shown in their most common spelling.
   */
  async locations(city?: string): Promise<ListingLocations> {
    const live = { status: { in: [...LIVE_STATUSES] } };
    const cityRows = await this.prisma.listing.groupBy({
      by: ['city'],
      where: live,
      _count: { _all: true },
    });
    const cities = foldCounts(
      cityRows.map((r) => [r.city, r._count._all] as const),
    );

    if (!city?.trim()) return { cities, localities: [] };

    const localityRows = await this.prisma.listing.groupBy({
      by: ['locality'],
      where: { ...live, ...cityWhere(city), locality: { not: null } },
      _count: { _all: true },
    });
    const localities = foldCounts(
      localityRows.map((r) => [r.locality, r._count._all] as const),
    );
    return { cities, localities };
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

  /** The seller's own listings — the owner DTO, so the edit form gets the PIN. */
  async listMine(userId: string): Promise<OwnerListing[]> {
    const rows = await this.prisma.listing.findMany({
      where: { sellerId: userId },
      include: withRefs,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOwnerListingDto);
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

  async create(userId: string, input: ListingInput): Promise<OwnerListing> {
    await this.assertCanList(userId);
    await this.assertCategory(input.categoryId);
    const city = normaliseCity(input.city);
    const locality = input.locality || null;
    const pincode = input.pincode || null;
    // A seller's contact and location travel with their profile: capture
    // them on each sell so the next listing form is prefilled. The location
    // is taken as a unit, keyed on the PIN (the web form requires it; the
    // mobile app sends none, and must not wipe the web-entered defaults).
    const defaults: Prisma.UserUpdateInput = {};
    if (input.whatsappNumber) {
      defaults.whatsappNumber = input.whatsappNumber;
      defaults.city = city;
    }
    if (pincode) Object.assign(defaults, { city, locality, pincode });
    if (Object.keys(defaults).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: defaults });
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
        city,
        locality,
        pincode,
        deliveryOption: input.deliveryOption,
        images: input.images,
        status: 'PENDING',
      },
      include: withRefs,
    });
    return toOwnerListingDto(row);
  }

  async update(
    userId: string,
    id: string,
    input: ListingUpdateInput,
  ): Promise<OwnerListing> {
    const existing = await this.owned(userId, id);
    if (existing.status === 'SOLD') {
      throw new BadRequestException('Sold listings cannot be edited');
    }
    if (input.categoryId) await this.assertCategory(input.categoryId);

    // Any edit to a listing that's already been reviewed sends it back into
    // the queue — otherwise a seller could get a listing approved once and
    // then freely swap in different photos/price/description with no further
    // review. The one exception: a live listing whose edit touches only where
    // it is and how it's handed over (city, locality, PIN, delivery). None of
    // that is what moderation checks, and sending it back to PENDING would
    // take a seller's live listing off the market for a day just for fixing
    // a PIN — which is exactly the edit we're asking sellers to make.
    const locationOnly =
      existing.status === 'APPROVED' && !changesBeyondLocation(existing, input);
    const status =
      !locationOnly &&
      (existing.status === 'REJECTED' || existing.status === 'APPROVED')
        ? 'PENDING'
        : existing.status;

    const row = await this.prisma.listing.update({
      where: { id },
      data: {
        ...input,
        ...(input.city !== undefined
          ? { city: normaliseCity(input.city) }
          : {}),
        // "" is a cleared field: store null, never an empty string.
        ...(input.locality !== undefined
          ? { locality: input.locality || null }
          : {}),
        ...(input.pincode !== undefined
          ? { pincode: input.pincode || null }
          : {}),
        usageDuration: input.usageDuration ?? undefined,
        reasonForSelling: input.reasonForSelling ?? undefined,
        status,
        rejectionReason: null,
      },
      include: withRefs,
    });
    return toOwnerListingDto(row);
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

  // Moderation covers reviewing a submission *and* acting on one already
  // live: taking a policy-violating listing down, or reinstating one rejected
  // by mistake. RESERVED and SOLD are excluded because the item is spoken for
  // — moving it would pull an in-flight purchase out from under its buyer.
  private static readonly MODERATABLE = [
    'PENDING',
    'APPROVED',
    'REJECTED',
  ] as const;

  async moderate(id: string, dto: ModerateListingInput): Promise<Listing> {
    const before = await this.prisma.listing.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!before) throw new NotFoundException('Listing not found');

    // Still a guarded updateMany rather than a plain update: the status could
    // change between the read above and this write (a buyer reserving it).
    const { count } = await this.prisma.listing.updateMany({
      where: { id, status: { in: [...ListingsService.MODERATABLE] } },
      data: {
        status: dto.status,
        rejectionReason: dto.status === 'REJECTED' ? dto.reason : null,
      },
    });
    if (count === 0) {
      const existing = await this.prisma.listing.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!existing) throw new NotFoundException('Listing not found');
      throw new BadRequestException(
        existing.status === 'SOLD'
          ? 'This listing has sold and can no longer be moderated.'
          : 'This listing is reserved for a buyer who is checking out. Wait for the hold to lapse, or cancel their order first.',
      );
    }
    const row = await this.prisma.listing.findUniqueOrThrow({
      where: { id },
      include: withRefs,
    });

    // A listing pulled after going live is a takedown, not a review decision
    // — telling that seller it "wasn't approved" would misdescribe it.
    const takenDown = dto.status === 'REJECTED' && before.status === 'APPROVED';
    const message =
      dto.status === 'APPROVED'
        ? `Your listing "${row.title}" is now live.`
        : takenDown
          ? `Your listing "${row.title}" has been removed from the marketplace: ${dto.reason}`
          : `Your listing "${row.title}" wasn't approved: ${dto.reason}`;
    await this.notifications.create(
      row.sellerId,
      dto.status === 'APPROVED' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      message,
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
      select: {
        registrationPaidAt: true,
        isSellerVerified: true,
        isSystemSeller: true,
      },
    });

    // The marketplace's own account is the platform, not a seller being
    // vetted by it — there is no fee for it to pay and nobody to approve it.
    // Admin listing creation runs through this same path (adminCreate), so
    // without this exemption it depends on flags an admin can toggle from
    // the Users screen: un-verifying that account silently 403s every
    // admin-created listing with a message telling the admin to get admin
    // approval. That is exactly how it broke.
    if (user?.isSystemSeller) return;

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

/** Same where-clause for browse and locations: see browse(). */
function cityWhere(raw: string): Prisma.ListingWhereInput {
  const spellings = [...new Set([raw.trim(), normaliseCity(raw)])];
  if (spellings.length === 1) {
    return { city: { equals: spellings[0], mode: 'insensitive' } };
  }
  return {
    OR: spellings.map((c) => ({
      city: { equals: c, mode: 'insensitive' as const },
    })),
  };
}

/**
 * Sum counts for values that differ only by case or spacing, name each group
 * by its most common spelling, and sort by count (desc) then name. Null and
 * blank values are dropped.
 */
export function foldCounts(
  rows: readonly (readonly [string | null, number])[],
): { name: string; count: number }[] {
  const groups = new Map<
    string,
    { total: number; spellings: Map<string, number> }
  >();
  for (const [value, count] of rows) {
    const name = value?.trim().replace(/\s+/g, ' ');
    if (!name) continue;
    const key = name.toLowerCase();
    const group = groups.get(key) ?? { total: 0, spellings: new Map() };
    group.total += count;
    group.spellings.set(name, (group.spellings.get(name) ?? 0) + count);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map(({ total, spellings }) => ({
      name: [...spellings.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'),
      )[0][0],
      count: total,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en'));
}

/**
 * True when an edit changes anything other than LOCATION_FIELDS. The web
 * form PATCHes every field, so this compares values, not which keys arrived.
 * A cleared optional text field ("") and a stored null count as equal.
 */
export function changesBeyondLocation(
  existing: ListingRecord,
  input: ListingUpdateInput,
): boolean {
  const current = existing as unknown as Record<string, unknown>;
  return Object.entries(input).some(([key, value]) => {
    if (value === undefined || LOCATION_FIELDS.has(key)) return false;
    const before = current[key];
    if (Array.isArray(value)) {
      return !(
        Array.isArray(before) &&
        before.length === value.length &&
        value.every((v, i) => v === before[i])
      );
    }
    const blank = (v: unknown) => (v === '' || v === undefined ? null : v);
    return blank(value) !== blank(before);
  });
}

/** The seller's own view of a listing: the public DTO plus the PIN. */
export function toOwnerListingDto(row: ListingRow): OwnerListing {
  return { ...toListingDto(row), pincode: row.pincode };
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
    // row.pincode is deliberately not mapped: this DTO is public.
    locality: row.locality,
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
