import { NotFoundException } from '@nestjs/common';
import type { PartnerOfferInput } from '@nutrimom/shared';
import { PartnerOffersService } from './partner-offers.service';

function makeService() {
  const prisma = {
    partnerOffer: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const svc = new PartnerOffersService(prisma as any);
  return { svc, prisma };
}

/** First argument of the nth call, typed — keeps assertions off `any`. */
function callArg<T>(fn: jest.Mock, nth = 0): T {
  return (fn.mock.calls as unknown as [T][])[nth][0];
}

type FindManyArgs = {
  where?: Record<string, unknown>;
  orderBy?: unknown;
};
type WriteArgs = { data: Record<string, unknown> };

const T = new Date('2026-11-11T00:00:00.000Z');

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'o1',
  brandName: 'Little Sprouts',
  logoUrl: null,
  description: 'Organic baby food delivered weekly.',
  benefit: '15% off your first order',
  couponCode: 'NURTURE15',
  url: 'https://example.com/shop',
  isAffiliate: false,
  expiresAt: null,
  isActive: true,
  sortOrder: 0,
  createdAt: T,
  updatedAt: T,
  ...over,
});

const input = (over: Partial<PartnerOfferInput> = {}): PartnerOfferInput => ({
  brandName: 'Little Sprouts',
  description: 'Organic baby food delivered weekly.',
  benefit: '15% off your first order',
  url: 'https://example.com/shop',
  isAffiliate: true,
  isActive: true,
  sortOrder: 0,
  ...over,
});

describe('PartnerOffersService', () => {
  describe('publicList', () => {
    it('asks only for active offers that have not expired yet', async () => {
      const { svc, prisma } = makeService();
      prisma.partnerOffer.findMany.mockResolvedValue([row()]);

      await svc.publicList(T);

      const args = callArg<FindManyArgs>(prisma.partnerOffer.findMany);
      expect(args.where).toEqual({
        isActive: true,
        // Open-ended, or ending strictly after now — an offer ending at this
        // exact instant is already over.
        OR: [{ expiresAt: null }, { expiresAt: { gt: T } }],
      });
      expect(args.orderBy).toEqual([
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ]);
    });

    it('defaults "now" to the current time', async () => {
      const { svc, prisma } = makeService();
      prisma.partnerOffer.findMany.mockResolvedValue([]);
      const before = Date.now();

      await svc.publicList();

      const { where } = callArg<{
        where: { OR: [unknown, { expiresAt: { gt: Date } }] };
      }>(prisma.partnerOffer.findMany);
      const gt = where.OR[1].expiresAt.gt.getTime();
      expect(gt).toBeGreaterThanOrEqual(before);
      expect(gt).toBeLessThanOrEqual(Date.now());
    });

    it('serialises dates to ISO strings', async () => {
      const { svc, prisma } = makeService();
      prisma.partnerOffer.findMany.mockResolvedValue([
        row({ expiresAt: new Date('2026-12-31T00:00:00.000Z') }),
      ]);

      const [offer] = await svc.publicList(T);

      expect(offer.expiresAt).toBe('2026-12-31T00:00:00.000Z');
    });
  });

  describe('adminList', () => {
    it('lists everything, expired and inactive included', async () => {
      const { svc, prisma } = makeService();
      prisma.partnerOffer.findMany.mockResolvedValue([
        row(),
        row({ id: 'o2', expiresAt: new Date('2020-01-01T00:00:00.000Z') }),
      ]);

      const list = await svc.adminList();

      expect(
        callArg<FindManyArgs>(prisma.partnerOffer.findMany).where,
      ).toBeUndefined();
      expect(list).toHaveLength(2);
    });
  });

  describe('create / update', () => {
    it('stores cleared optional fields as null', async () => {
      const { svc, prisma } = makeService();
      prisma.partnerOffer.create.mockResolvedValue(row());

      await svc.create(input({ logoUrl: '', couponCode: '', expiresAt: '' }));

      const { data } = callArg<WriteArgs>(prisma.partnerOffer.create);
      expect(data.logoUrl).toBeNull();
      expect(data.couponCode).toBeNull();
      expect(data.expiresAt).toBeNull();
      expect(data.isAffiliate).toBe(true);
    });

    it('reports an unknown offer as not found on update', async () => {
      const { svc, prisma } = makeService();
      prisma.partnerOffer.update.mockRejectedValue({ code: 'P2025' });

      await expect(svc.update('nope', input())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('reports an unknown offer as not found on delete', async () => {
      const { svc, prisma } = makeService();
      prisma.partnerOffer.delete.mockRejectedValue({ code: 'P2025' });

      await expect(svc.remove('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
