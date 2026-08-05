import { ForbiddenException } from '@nestjs/common';
import type { ListingInput } from '@nutrimom/shared';
import { ListingsService } from './listings.service';

function makeService() {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    sellerMembership: { findFirst: jest.fn() },
    category: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
    listing: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const notifications = { create: jest.fn() };
  const svc = new ListingsService(
    prisma as any,
    notifications as any,
    {} as any,
  );
  return { svc, prisma, notifications };
}

const listingRow = {
  id: 'l1',
  title: 'Cot',
  description: 'A cot',
  condition: 'GOOD',
  originalPriceInPaise: null,
  sellingPriceInPaise: 250000,
  purchaseDate: null,
  usageDuration: null,
  reasonForSelling: null,
  city: 'Hyderabad',
  deliveryOption: 'BOTH',
  images: [],
  status: 'PENDING',
  isFeatured: false,
  reservedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  categoryId: 'c1',
  sellerId: 's1',
  category: { id: 'c1', name: 'Cots', slug: 'cots' },
  seller: {
    id: 's1',
    name: 'Seller',
    city: 'Hyderabad',
    whatsappNumber: null,
    isSellerVerified: true,
  },
};

const input: ListingInput = {
  title: 'Cot',
  description: 'A cot in good condition.',
  categoryId: 'c1',
  condition: 'GOOD',
  sellingPriceInPaise: 250000,
  city: 'Hyderabad',
  deliveryOption: 'BOTH',
  images: ['https://example.org/cot.jpg'],
};

describe('ListingsService — who may create a listing', () => {
  it('lets the marketplace system seller list without verification or a membership', async () => {
    const { svc, prisma } = makeService();
    // Deliberately the state that used to break admin listing creation: the
    // platform account with verification switched off and no membership row.
    prisma.user.findUnique.mockResolvedValue({
      isSystemSeller: true,
      isSellerVerified: false,
      registrationPaidAt: null,
    });
    prisma.sellerMembership.findFirst.mockResolvedValue(null);
    prisma.listing.create.mockResolvedValue(listingRow);

    await expect(svc.create('marketplace', input)).resolves.toMatchObject({
      id: 'l1',
    });
    expect(prisma.sellerMembership.findFirst).not.toHaveBeenCalled();
  });

  it('still refuses an unverified human seller', async () => {
    const { svc, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      isSystemSeller: false,
      isSellerVerified: false,
      registrationPaidAt: new Date(),
    });

    await expect(svc.create('u1', input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('still refuses a verified seller with no active membership', async () => {
    const { svc, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      isSystemSeller: false,
      isSellerVerified: true,
      registrationPaidAt: new Date(),
    });
    prisma.sellerMembership.findFirst.mockResolvedValue(null);

    await expect(svc.create('u1', input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows a fully verified seller holding a membership', async () => {
    const { svc, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      isSystemSeller: false,
      isSellerVerified: true,
      registrationPaidAt: new Date(),
    });
    prisma.sellerMembership.findFirst.mockResolvedValue({ id: 'm1' });
    prisma.listing.create.mockResolvedValue(listingRow);

    await expect(svc.create('u1', input)).resolves.toMatchObject({ id: 'l1' });
  });
});

describe('ListingsService — moderation reaches live listings', () => {
  const setup = (status: string) => {
    const ctx = makeService();
    ctx.prisma.listing.findUnique.mockResolvedValue({ status });
    ctx.prisma.listing.updateMany.mockResolvedValue({
      count: ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? 1 : 0,
    });
    ctx.prisma.listing.findUniqueOrThrow.mockResolvedValue(listingRow);
    return ctx;
  };

  it('takes an APPROVED listing down', async () => {
    const { svc, notifications } = setup('APPROVED');

    await expect(
      svc.moderate('l1', { status: 'REJECTED', reason: 'Restricted item' }),
    ).resolves.toMatchObject({ id: 'l1' });

    // A live listing being pulled is a takedown, not a review verdict — the
    // seller shouldn't be told their published item "wasn't approved".
    expect(notifications.create).toHaveBeenCalledWith(
      expect.anything(),
      'LISTING_REJECTED',
      expect.stringContaining('has been removed from the marketplace'),
      expect.anything(),
    );
  });

  it('reinstates a REJECTED listing', async () => {
    const { svc, notifications } = setup('REJECTED');

    await expect(
      svc.moderate('l1', { status: 'APPROVED' }),
    ).resolves.toMatchObject({ id: 'l1' });
    expect(notifications.create).toHaveBeenCalledWith(
      expect.anything(),
      'LISTING_APPROVED',
      expect.stringContaining('is now live'),
      expect.anything(),
    );
  });

  it('still words a PENDING rejection as a review decision', async () => {
    const { svc, notifications } = setup('PENDING');

    await svc.moderate('l1', { status: 'REJECTED', reason: 'Blurry photos' });

    expect(notifications.create).toHaveBeenCalledWith(
      expect.anything(),
      'LISTING_REJECTED',
      expect.stringContaining("wasn't approved"),
      expect.anything(),
    );
  });

  it('refuses to moderate a SOLD listing', async () => {
    const { svc, prisma } = setup('SOLD');
    prisma.listing.findUnique.mockResolvedValue({ status: 'SOLD' });

    await expect(
      svc.moderate('l1', { status: 'REJECTED', reason: 'too late' }),
    ).rejects.toThrow(/sold/i);
  });

  it('refuses to moderate a RESERVED listing mid-checkout', async () => {
    const { svc, prisma } = setup('RESERVED');
    prisma.listing.findUnique.mockResolvedValue({ status: 'RESERVED' });

    // Pulling it here would yank the item out from under a buyer who is
    // partway through paying for it.
    await expect(
      svc.moderate('l1', { status: 'REJECTED', reason: 'policy' }),
    ).rejects.toThrow(/reserved/i);
  });

  it('404s a listing that does not exist', async () => {
    const { svc, prisma } = makeService();
    prisma.listing.findUnique.mockResolvedValue(null);

    await expect(svc.moderate('gone', { status: 'APPROVED' })).rejects.toThrow(
      /not found/i,
    );
  });
});
