import { listingQuerySchema, type ListingInput } from '@nutrimom/shared';
import {
  ListingsService,
  foldCounts,
  toListingDto,
  toOwnerListingDto,
} from './listings.service';

/**
 * Marketplace location (REDESIGN-PLAN.md phase 5): saving city/locality/PIN,
 * the browse filters, GET /listings/locations, keeping the PIN out of public
 * payloads, and location-only edits not re-triggering moderation.
 */

/** A mock's nth call's first argument, typed loosely enough to assert on. */
interface QueryArg {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
  orderBy: unknown;
  by: unknown;
}
function arg(fn: jest.Mock, nth = 0): QueryArg {
  return (fn.mock.calls as unknown as [QueryArg][])[nth][0];
}

function makeService() {
  const prisma = {
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    user: {
      findUnique: jest.fn().mockResolvedValue({
        isSystemSeller: false,
        isSellerVerified: true,
        registrationPaidAt: new Date(),
      }),
      update: jest.fn(),
    },
    sellerMembership: { findFirst: jest.fn().mockResolvedValue({ id: 'm1' }) },
    category: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
    listing: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const svc = new ListingsService(
    prisma as any,
    { create: jest.fn() } as any,
    {} as any,
  );
  return { svc, prisma };
}

/** A listing row as Prisma returns it (with withRefs included). */
const row = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  title: 'Cot',
  description: 'A sturdy wooden cot.',
  condition: 'GOOD',
  originalPriceInPaise: null,
  sellingPriceInPaise: 250000,
  purchaseDate: null,
  usageDuration: '8 months',
  reasonForSelling: null,
  city: 'Hyderabad',
  locality: 'Kondapur',
  pincode: '500084',
  deliveryOption: 'PICKUP',
  images: ['https://example.org/cot-1.jpg', 'https://example.org/cot-2.jpg'],
  status: 'APPROVED',
  rejectionReason: null,
  isFeatured: false,
  reservedUntil: null,
  createdAt: new Date('2026-11-01T10:00:00.000Z'),
  updatedAt: new Date('2026-11-01T10:00:00.000Z'),
  categoryId: 'c1',
  sellerId: 's1',
  category: { id: 'c1', name: 'Cots', slug: 'cots' },
  seller: {
    id: 's1',
    name: 'Seller',
    city: 'Hyderabad',
    whatsappNumber: '9876543210',
    isSellerVerified: true,
  },
  ...over,
});

/** What the web edit form PATCHes: every field, mostly unchanged. */
const fullEdit = (over: Record<string, unknown> = {}) => ({
  title: 'Cot',
  description: 'A sturdy wooden cot.',
  categoryId: 'c1',
  condition: 'GOOD' as const,
  sellingPriceInPaise: 250000,
  usageDuration: '8 months',
  reasonForSelling: '',
  city: 'Hyderabad',
  locality: 'Kondapur',
  pincode: '500084',
  deliveryOption: 'PICKUP' as const,
  images: ['https://example.org/cot-1.jpg', 'https://example.org/cot-2.jpg'],
  ...over,
});

const browseWhere = async (params: Record<string, string>) => {
  const { svc, prisma } = makeService();
  await svc.browse(listingQuerySchema.parse(params));
  return {
    where: arg(prisma.listing.findMany).where,
    orderBy: arg(prisma.listing.findMany).orderBy,
    countWhere: arg(prisma.listing.count).where,
  };
};

describe('ListingsService.browse — location filters', () => {
  it('matches city exactly (case-insensitive), so "Delhi" does not return "New Delhi"', async () => {
    const { where } = await browseWhere({ city: 'Delhi' });
    expect(where.city).toEqual({ equals: 'Delhi', mode: 'insensitive' });
    expect(JSON.stringify(where)).not.toContain('contains');
  });

  it('also matches the canonical spelling of an alias', async () => {
    const { where } = await browseWhere({ city: 'bangalore' });
    expect(where.OR).toEqual([
      { city: { equals: 'bangalore', mode: 'insensitive' } },
      { city: { equals: 'Bengaluru', mode: 'insensitive' } },
    ]);
  });

  it('contains-matches locality and exact-matches the PIN', async () => {
    const { where } = await browseWhere({
      locality: ' Koraman ',
      pincode: '560034',
    });
    expect(where.locality).toEqual({
      contains: 'Koraman',
      mode: 'insensitive',
    });
    expect(where.pincode).toBe('560034');
  });

  it('treats an empty ?pincode= / ?city= as no filter', async () => {
    const { where } = await browseWhere({ city: '', pincode: '' });
    expect(where).toEqual({ status: 'APPROVED' });
  });

  it('combines location with category, price, condition, delivery, search and sort', async () => {
    const { where, orderBy, countWhere } = await browseWhere({
      city: 'Pune',
      locality: 'Baner',
      pincode: '411045',
      category: 'strollers',
      condition: 'LIKE_NEW',
      delivery: 'BOTH',
      minPrice: '10000',
      maxPrice: '500000',
      search: 'chicco',
      sort: 'price-asc',
    });
    expect(where).toEqual({
      status: 'APPROVED',
      category: { slug: 'strollers' },
      condition: 'LIKE_NEW',
      deliveryOption: 'BOTH',
      city: { equals: 'Pune', mode: 'insensitive' },
      locality: { contains: 'Baner', mode: 'insensitive' },
      pincode: '411045',
      title: { contains: 'chicco', mode: 'insensitive' },
      sellingPriceInPaise: { gte: 10000, lte: 500000 },
    });
    expect(orderBy).toEqual({ sellingPriceInPaise: 'asc' });
    // The total is counted over the same filter as the page.
    expect(countWhere).toBe(where);
  });
});

describe('ListingsService.locations', () => {
  it('counts cities with live listings, grouping case/spacing variants', async () => {
    const { svc, prisma } = makeService();
    prisma.listing.groupBy.mockResolvedValueOnce([
      { city: 'Delhi', _count: { _all: 3 } },
      { city: 'delhi ', _count: { _all: 1 } },
      { city: 'Pune', _count: { _all: 5 } },
      { city: 'Agra', _count: { _all: 4 } },
      { city: '   ', _count: { _all: 2 } },
    ]);
    const result = await svc.locations();

    expect(result).toEqual({
      cities: [
        { name: 'Pune', count: 5 },
        // Ties sort by name.
        { name: 'Agra', count: 4 },
        { name: 'Delhi', count: 4 },
      ],
      localities: [],
    });
    expect(prisma.listing.groupBy).toHaveBeenCalledTimes(1);
    expect(arg(prisma.listing.groupBy).where).toEqual({
      status: { in: ['APPROVED', 'RESERVED'] },
    });
  });

  it('lists the localities of a chosen city, dropping blanks and nulls', async () => {
    const { svc, prisma } = makeService();
    prisma.listing.groupBy
      .mockResolvedValueOnce([{ city: 'Bengaluru', _count: { _all: 9 } }])
      .mockResolvedValueOnce([
        { locality: 'Koramangala', _count: { _all: 2 } },
        { locality: 'koramangala', _count: { _all: 1 } },
        { locality: 'HSR  Layout', _count: { _all: 4 } },
        { locality: null, _count: { _all: 3 } },
        { locality: '', _count: { _all: 1 } },
      ]);
    const result = await svc.locations('Bengaluru');

    expect(result.localities).toEqual([
      { name: 'HSR Layout', count: 4 },
      // Shown in its most common spelling.
      { name: 'Koramangala', count: 3 },
    ]);
    expect(arg(prisma.listing.groupBy, 1)).toMatchObject({
      by: ['locality'],
      where: {
        status: { in: ['APPROVED', 'RESERVED'] },
        city: { equals: 'Bengaluru', mode: 'insensitive' },
        locality: { not: null },
      },
    });
  });

  it('foldCounts names a group by its most frequent spelling', () => {
    expect(
      foldCounts([
        ['indiranagar', 1],
        ['Indiranagar', 3],
        ['INDIRANAGAR', 1],
      ]),
    ).toEqual([{ name: 'Indiranagar', count: 5 }]);
  });
});

describe('PIN code privacy', () => {
  it('is never in the public listing DTO', () => {
    const dto = toListingDto(row() as any);
    expect(dto).not.toHaveProperty('pincode');
    expect(JSON.stringify(dto)).not.toContain('500084');
    expect(dto.locality).toBe('Kondapur');
  });

  it('is absent from public browse and detail responses', async () => {
    const { svc, prisma } = makeService();
    prisma.listing.findMany.mockResolvedValue([row()]);
    prisma.listing.count.mockResolvedValue(1);
    prisma.listing.findUnique.mockResolvedValue(row());

    const page = await svc.browse(listingQuerySchema.parse({}));
    const detail = await svc.getPublic('l1');
    expect(JSON.stringify(page)).not.toContain('500084');
    expect(JSON.stringify(detail)).not.toContain('500084');
  });

  it("is included for the owner's own listings, so the edit form can prefill it", async () => {
    const { svc, prisma } = makeService();
    prisma.listing.findMany.mockResolvedValue([row()]);
    const mine = await svc.listMine('s1');
    expect(mine[0].pincode).toBe('500084');
    expect(toOwnerListingDto(row({ pincode: null }) as any).pincode).toBeNull();
  });
});

describe('ListingsService.create — location', () => {
  const input = (over: Partial<ListingInput> = {}): ListingInput => ({
    title: 'Cot',
    description: 'A sturdy wooden cot.',
    categoryId: 'c1',
    condition: 'GOOD',
    sellingPriceInPaise: 250000,
    city: 'Hyderabad',
    deliveryOption: 'PICKUP',
    images: ['https://example.org/cot-1.jpg'],
    ...over,
  });

  it('saves locality and PIN, and makes them the seller defaults', async () => {
    const { svc, prisma } = makeService();
    prisma.listing.create.mockResolvedValue(row({ status: 'PENDING' }));
    await svc.create(
      's1',
      input({ city: 'hyderabad', locality: 'Kondapur', pincode: '500084' }),
    );

    expect(arg(prisma.listing.create).data).toMatchObject({
      city: 'Hyderabad',
      locality: 'Kondapur',
      pincode: '500084',
      status: 'PENDING',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { city: 'Hyderabad', locality: 'Kondapur', pincode: '500084' },
    });
  });

  it('stores blank locality/PIN as null and leaves defaults alone (mobile app)', async () => {
    const { svc, prisma } = makeService();
    prisma.listing.create.mockResolvedValue(row({ status: 'PENDING' }));
    await svc.create('s1', input({ locality: '', pincode: '' }));

    const data = arg(prisma.listing.create).data;
    expect(data.locality).toBeNull();
    expect(data.pincode).toBeNull();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('ListingsService.update — moderation on edit', () => {
  const editApproved = async (
    patch: Record<string, unknown>,
    existing: Record<string, unknown> = {},
  ) => {
    const { svc, prisma } = makeService();
    prisma.listing.findUnique.mockResolvedValue(row(existing));
    prisma.listing.update.mockResolvedValue(row(existing));
    await svc.update('s1', 'l1', fullEdit(patch));
    return arg(prisma.listing.update).data;
  };

  it('keeps a live listing APPROVED when only city/locality/PIN/delivery change', async () => {
    const data = await editApproved({
      city: 'Secunderabad',
      locality: 'Trimulgherry',
      pincode: '500015',
      deliveryOption: 'BOTH',
    });
    expect(data.status).toBe('APPROVED');
    expect(data).toMatchObject({
      city: 'Secunderabad',
      locality: 'Trimulgherry',
      pincode: '500015',
      deliveryOption: 'BOTH',
    });
  });

  it('keeps it APPROVED when the form is re-saved with nothing changed', async () => {
    expect((await editApproved({})).status).toBe('APPROVED');
  });

  it('sends a title edit back to PENDING', async () => {
    expect((await editApproved({ title: 'Wooden cot' })).status).toBe(
      'PENDING',
    );
  });

  it.each([
    ['price', { sellingPriceInPaise: 200000 }],
    ['description', { description: 'A sturdy wooden cot, barely used.' }],
    ['condition', { condition: 'FAIR' }],
    ['category', { categoryId: 'c2' }],
    [
      'photos (reordered)',
      {
        images: [
          'https://example.org/cot-2.jpg',
          'https://example.org/cot-1.jpg',
        ],
      },
    ],
    ['reason for selling', { reasonForSelling: 'Outgrown' }],
  ])(
    'sends a %s edit back to PENDING, even alongside a PIN fix',
    async (_label, patch) => {
      const data = await editApproved({ ...patch, pincode: '500015' });
      expect(data.status).toBe('PENDING');
    },
  );

  it('still sends a REJECTED listing back to review on a location-only edit', async () => {
    const data = await editApproved(
      { pincode: '500015' },
      { status: 'REJECTED', rejectionReason: 'Blurry photos' },
    );
    expect(data.status).toBe('PENDING');
  });

  it('stores a cleared locality or PIN as null, not ""', async () => {
    const data = await editApproved({ locality: '', pincode: '' });
    expect(data.locality).toBeNull();
    expect(data.pincode).toBeNull();
  });
});
