import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DONATION_STATUS_TRANSITIONS,
  DonationStatus,
  donationOfferInputSchema,
  type DonationOfferInput,
} from '@nutrimom/shared';
import { DonationsService } from './donations.service';

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
    category: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
    donationOffer: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(),
  };
  // Interactive transaction: the callback gets the same mock as its client.
  prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma),
  );
  const notifications = { notifyAdmins: jest.fn() };
  const svc = new DonationsService(prisma as any, notifications as any);
  return { svc, prisma, notifications };
}

const row = (over: Record<string, unknown> = {}) => ({
  id: 'd1',
  donorId: 'u1',
  contactName: 'Asha',
  contactEmail: 'asha@example.com',
  contactPhone: '9876543210',
  city: 'Bengaluru',
  locality: 'Koramangala',
  pincode: '560034',
  categoryId: 'c1',
  category: { id: 'c1', name: 'Clothes', slug: 'clothes' },
  itemsDescription: 'A bag of 0-6 month onesies, washed and folded.',
  condition: 'GOOD',
  images: [],
  handover: 'PICKUP',
  status: 'NEW',
  adminNote: null,
  createdAt: new Date('2026-11-11T09:00:00.000Z'),
  updatedAt: new Date('2026-11-11T09:00:00.000Z'),
  ...over,
});

const input = (over: Record<string, unknown> = {}): DonationOfferInput =>
  donationOfferInputSchema.parse({
    contactName: 'Asha',
    contactEmail: 'asha@example.com',
    contactPhone: '98765 43210',
    city: 'bangalore',
    locality: 'Koramangala',
    pincode: '560034',
    categoryId: 'c1',
    itemsDescription: 'A bag of 0-6 month onesies, washed and folded.',
    condition: 'GOOD',
    handover: 'PICKUP',
    ...over,
  });

describe('DonationsService.create', () => {
  it('stores the offer as NEW with the city normalised', async () => {
    const { svc, prisma } = makeService();
    prisma.donationOffer.create.mockResolvedValue(row());
    const dto = await svc.create('u1', input());

    expect(arg(prisma.donationOffer.create).data).toMatchObject({
      donorId: 'u1',
      city: 'Bengaluru',
      locality: 'Koramangala',
      pincode: '560034',
      categoryId: 'c1',
      status: 'NEW',
      images: [],
    });
    expect(dto).toMatchObject({ id: 'd1', status: 'NEW', pincode: '560034' });
  });

  it('notifies every admin with DONATION_OFFERED, in the same transaction, linked to the donor', async () => {
    const { svc, prisma, notifications } = makeService();
    prisma.donationOffer.create.mockResolvedValue(row());
    await svc.create('u1', input());

    expect(notifications.notifyAdmins).toHaveBeenCalledTimes(1);
    const [type, message, listingId, orderId, tx, relatedUserId] = (
      notifications.notifyAdmins.mock.calls as unknown as unknown[][]
    )[0];
    expect(type).toBe('DONATION_OFFERED');
    expect(message).toContain('Asha in Bengaluru');
    expect([listingId, orderId]).toEqual([null, null]);
    expect(tx).toBe(prisma);
    expect(relatedUserId).toBe('u1');
  });

  it('stores a blank locality and category as null', async () => {
    const { svc, prisma } = makeService();
    prisma.donationOffer.create.mockResolvedValue(row());
    await svc.create('u1', input({ locality: '', categoryId: '' }));

    const data = arg(prisma.donationOffer.create).data;
    expect(data.locality).toBeNull();
    expect(data.categoryId).toBeNull();
    expect(prisma.category.findUnique).not.toHaveBeenCalled();
  });

  it('refuses an unknown category with 400 and creates nothing', async () => {
    const { svc, prisma, notifications } = makeService();
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(svc.create('u1', input())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.donationOffer.create).not.toHaveBeenCalled();
    expect(notifications.notifyAdmins).not.toHaveBeenCalled();
  });
});

describe('DonationsService reads', () => {
  it("lists only the donor's own offers", async () => {
    const { svc, prisma } = makeService();
    await svc.listMine('u1');
    expect(arg(prisma.donationOffer.findMany).where).toEqual({
      donorId: 'u1',
    });
  });

  it('filters the admin queue by status and donor', async () => {
    const { svc, prisma } = makeService();
    await svc.adminList({ status: 'CONTACTED', donorId: 'u1' });
    expect(arg(prisma.donationOffer.findMany).where).toEqual({
      status: 'CONTACTED',
      donorId: 'u1',
    });
  });

  it('404s an unknown donation', async () => {
    const { svc, prisma } = makeService();
    prisma.donationOffer.findUnique.mockResolvedValue(null);
    await expect(svc.adminGet('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('DonationsService.adminUpdate — status transitions', () => {
  const statuses = Object.values(DonationStatus);
  const legal = new Set([
    'NEW>CONTACTED',
    'NEW>DECLINED',
    'CONTACTED>MATCHED',
    'CONTACTED>DECLINED',
    'MATCHED>COMPLETED',
    'MATCHED>DECLINED',
  ]);
  const pairs = statuses.flatMap((from) =>
    statuses.filter((to) => to !== from).map((to) => [from, to] as const),
  );

  it('the shared transition table is exactly the documented lifecycle', () => {
    const table = Object.entries(DONATION_STATUS_TRANSITIONS).flatMap(
      ([from, tos]) => tos.map((to) => `${from}>${to}`),
    );
    expect(new Set(table)).toEqual(legal);
  });

  it.each(pairs.filter(([f, t]) => legal.has(`${f}>${t}`)))(
    'allows %s → %s',
    async (from, to) => {
      const { svc, prisma } = makeService();
      prisma.donationOffer.findUnique
        .mockResolvedValueOnce({ status: from })
        .mockResolvedValueOnce(row({ status: to }));
      const dto = await svc.adminUpdate('d1', { status: to });

      expect(prisma.donationOffer.updateMany).toHaveBeenCalledWith({
        where: { id: 'd1', status: from },
        data: { status: to },
      });
      expect(dto.status).toBe(to);
    },
  );

  it.each(pairs.filter(([f, t]) => !legal.has(`${f}>${t}`)))(
    'refuses %s → %s with 400',
    async (from, to) => {
      const { svc, prisma } = makeService();
      prisma.donationOffer.findUnique.mockResolvedValueOnce({ status: from });
      await expect(
        svc.adminUpdate('d1', { status: to }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.donationOffer.updateMany).not.toHaveBeenCalled();
    },
  );

  it.each(statuses)(
    'lets the note change without a move, even when %s',
    async (status) => {
      const { svc, prisma } = makeService();
      prisma.donationOffer.findUnique
        .mockResolvedValueOnce({ status })
        .mockResolvedValueOnce(row({ status, adminNote: 'Called her' }));
      await svc.adminUpdate('d1', { status, adminNote: 'Called her' });
      expect(arg(prisma.donationOffer.updateMany).data).toEqual({
        status,
        adminNote: 'Called her',
      });
    },
  );

  it('clears the note on "" and leaves it alone when omitted', async () => {
    const { svc, prisma } = makeService();
    prisma.donationOffer.findUnique.mockResolvedValue(row({ status: 'NEW' }));
    await svc.adminUpdate('d1', { status: 'CONTACTED', adminNote: '' });
    await svc.adminUpdate('d1', { status: 'CONTACTED' });
    expect(arg(prisma.donationOffer.updateMany).data).toEqual({
      status: 'CONTACTED',
      adminNote: null,
    });
    expect(arg(prisma.donationOffer.updateMany, 1).data).toEqual({
      status: 'CONTACTED',
    });
  });

  it('404s an unknown donation', async () => {
    const { svc, prisma } = makeService();
    prisma.donationOffer.findUnique.mockResolvedValue(null);
    await expect(
      svc.adminUpdate('nope', { status: 'CONTACTED' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses a move that lost a race with another admin', async () => {
    const { svc, prisma } = makeService();
    prisma.donationOffer.findUnique.mockResolvedValue({ status: 'NEW' });
    prisma.donationOffer.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      svc.adminUpdate('d1', { status: 'CONTACTED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
