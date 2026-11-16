import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ServicePackageInput } from '@nutrimom/shared';
import { ServicePackagesService } from './service-packages.service';

function makeService() {
  const prisma = {
    servicePackage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const svc = new ServicePackagesService(prisma as any);
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

const LONG_AGO = new Date('2026-01-01T00:00:00.000Z');

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'p1',
  group: 'COMBO',
  name: 'Monthly Combo',
  summary: '8 Prenatal Yoga + 4 Garbhasanskar',
  includes: ['8 live yoga sessions', '4 Garbhasanskar sessions'],
  sessionCount: 12,
  sessionMinutes: null,
  validityDays: null,
  format: 'LIVE_GROUP',
  pricePaise: 149900,
  priceSince: LONG_AGO,
  offerPricePaise: null,
  offerLabel: null,
  offerEndsAt: null,
  isIntroductory: false,
  isBestValue: true,
  isActive: true,
  sortOrder: 0,
  createdAt: LONG_AGO,
  updatedAt: LONG_AGO,
  ...over,
});

const input = (
  over: Partial<ServicePackageInput> = {},
): ServicePackageInput => ({
  group: 'COMBO',
  name: 'Monthly Combo',
  summary: '8 Prenatal Yoga + 4 Garbhasanskar',
  includes: ['8 live yoga sessions', '4 Garbhasanskar sessions'],
  sessionCount: 12,
  format: 'LIVE_GROUP',
  pricePaise: 149900,
  isIntroductory: false,
  isBestValue: true,
  isActive: true,
  sortOrder: 0,
  ...over,
});

/** The `data` the service last asked Prisma to write. */
function written(mock: jest.Mock) {
  return callArg<WriteArgs>(mock, mock.mock.calls.length - 1).data;
}

describe('ServicePackagesService', () => {
  describe('publicList', () => {
    it('returns active packages only, in page order', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findMany.mockResolvedValue([row()]);

      const list = await svc.publicList();

      const args = callArg<FindManyArgs>(prisma.servicePackage.findMany);
      expect(args.where).toEqual({ isActive: true });
      expect(args.orderBy).toEqual([
        { group: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ]);
      expect(list[0].priceSince).toBe(LONG_AGO.toISOString());
    });

    it('narrows to one group when asked', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findMany.mockResolvedValue([]);

      await svc.publicList('NUTRITION');

      expect(
        callArg<FindManyArgs>(prisma.servicePackage.findMany).where,
      ).toEqual({
        isActive: true,
        group: 'NUTRITION',
      });
    });
  });

  describe('adminList', () => {
    it('includes inactive packages', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findMany.mockResolvedValue([
        row(),
        row({ id: 'p2', isActive: false }),
      ]);

      const list = await svc.adminList();

      expect(
        callArg<FindManyArgs>(prisma.servicePackage.findMany).where,
      ).toBeUndefined();
      expect(list.map((p) => p.isActive)).toEqual([true, false]);
    });
  });

  describe('create', () => {
    it('starts the regular price clock now', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.create.mockResolvedValue(row());
      const before = Date.now();

      await svc.create(input());

      const data = written(prisma.servicePackage.create);
      expect(data.priceSince).toBeInstanceOf(Date);
      expect((data.priceSince as Date).getTime()).toBeGreaterThanOrEqual(
        before,
      );
    });

    it('stores cleared optional fields as null, not ""', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.create.mockResolvedValue(row());

      await svc.create(
        input({ offerLabel: '', offerEndsAt: '', sessionMinutes: undefined }),
      );

      const data = written(prisma.servicePackage.create);
      expect(data.offerLabel).toBeNull();
      expect(data.offerEndsAt).toBeNull();
      expect(data.sessionMinutes).toBeNull();
      expect(data.offerPricePaise).toBeNull();
    });

    it('stores an offer end date as a Date', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.create.mockResolvedValue(row());

      await svc.create(
        input({
          offerPricePaise: 99900,
          offerEndsAt: '2026-12-31T18:29:59.000Z',
        }),
      );

      expect(written(prisma.servicePackage.create).offerEndsAt).toEqual(
        new Date('2026-12-31T18:29:59.000Z'),
      );
    });

    it('refuses an introductory price that also carries an offer', async () => {
      const { svc, prisma } = makeService();

      await expect(
        svc.create(input({ isIntroductory: true, offerPricePaise: 99900 })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.servicePackage.create).not.toHaveBeenCalled();
    });

    it('refuses an "offer" that is not below the regular price', async () => {
      const { svc } = makeService();

      await expect(
        svc.create(input({ offerPricePaise: 149900 })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('bumps priceSince when the regular price changes', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(row());
      prisma.servicePackage.update.mockResolvedValue(row());
      const before = Date.now();

      await svc.update('p1', input({ pricePaise: 179900 }));

      const data = written(prisma.servicePackage.update);
      expect(data.priceSince).toBeInstanceOf(Date);
      expect((data.priceSince as Date).getTime()).toBeGreaterThanOrEqual(
        before,
      );
    });

    it('leaves priceSince alone when only the offer or copy changes', async () => {
      // Otherwise every edit would make a long-standing regular price look
      // brand new and trip the "struck-through price" warning for nothing.
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(row());
      prisma.servicePackage.update.mockResolvedValue(row());

      await svc.update(
        'p1',
        input({ name: 'Monthly Combo (renamed)', offerPricePaise: 129900 }),
      );

      expect(written(prisma.servicePackage.update)).not.toHaveProperty(
        'priceSince',
      );
    });

    it('reports an unknown package as not found', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(null);

      await expect(svc.update('nope', input())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.servicePackage.update).not.toHaveBeenCalled();
    });

    it('reports a package deleted mid-update as not found', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(row());
      prisma.servicePackage.update.mockRejectedValue({ code: 'P2025' });

      await expect(svc.update('p1', input())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lets an unrelated database error propagate', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(row());
      const fault = new Error('connection reset');
      prisma.servicePackage.update.mockRejectedValue(fault);

      await expect(svc.update('p1', input())).rejects.toBe(fault);
    });
  });

  describe('remove', () => {
    it('deletes and echoes the id', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.delete.mockResolvedValue(row());

      await expect(svc.remove('p1')).resolves.toEqual({ id: 'p1' });
    });

    it('reports an unknown package as not found', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.delete.mockRejectedValue({ code: 'P2025' });

      await expect(svc.remove('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
