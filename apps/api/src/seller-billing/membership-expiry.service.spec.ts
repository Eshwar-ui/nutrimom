import { Logger } from '@nestjs/common';
import { MembershipExpiryService } from './membership-expiry.service';

const DAY_MS = 24 * 60 * 60 * 1000;

interface MembershipRow {
  id: string;
  userId: string;
  expiresAt: Date;
  expiryWarningSentAt: Date | null;
}

function makeService() {
  const tx = {
    sellerMembership: {
      // Defaults to winning the claim; a test simulating a concurrent sweep
      // overrides it with { count: 0 }.
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    sellerMembership: {
      findMany: jest.fn<Promise<MembershipRow[]>, []>().mockResolvedValue([]),
      groupBy: jest
        .fn<Promise<{ userId: string; _max: { expiresAt: Date } }[]>, []>()
        .mockResolvedValue([]),
      updateMany: tx.sellerMembership.updateMany,
    },
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  };
  const notifications = { create: jest.fn() };
  const svc = new MembershipExpiryService(prisma as any, notifications as any);
  return { svc, prisma, notifications };
}

describe('MembershipExpiryService', () => {
  it('warns a seller whose window closes soon, with the day count', async () => {
    const { svc, prisma, notifications } = makeService();
    const expiresAt = new Date(Date.now() + 3 * DAY_MS);
    prisma.sellerMembership.findMany.mockResolvedValue([
      { id: 'm1', userId: 'u1', expiresAt, expiryWarningSentAt: null },
    ]);
    prisma.sellerMembership.groupBy.mockResolvedValue([
      { userId: 'u1', _max: { expiresAt } },
    ]);

    const result = await svc.sweep();

    expect(result).toEqual({ warned: 1, expired: 0 });
    // Trailing args: no listing/order to link to, and the tx the stamp was
    // claimed in — the notice and the stamp commit together or not at all.
    expect(notifications.create).toHaveBeenCalledWith(
      'u1',
      'MEMBERSHIP_EXPIRING',
      expect.stringContaining('3 days'),
      null,
      null,
      expect.anything(),
    );
  });

  it('tells a seller once the window has actually lapsed', async () => {
    const { svc, prisma, notifications } = makeService();
    const expiresAt = new Date(Date.now() - DAY_MS);
    prisma.sellerMembership.findMany.mockResolvedValue([
      { id: 'm1', userId: 'u1', expiresAt, expiryWarningSentAt: null },
    ]);
    prisma.sellerMembership.groupBy.mockResolvedValue([
      { userId: 'u1', _max: { expiresAt } },
    ]);

    const result = await svc.sweep();

    expect(result).toEqual({ warned: 0, expired: 1 });
    expect(notifications.create).toHaveBeenCalledWith(
      'u1',
      'MEMBERSHIP_EXPIRED',
      expect.stringContaining('expired'),
      null,
      null,
      expect.anything(),
    );
    // Both stamps set, so an already-lapsed window never emits a pointless
    // "expiring soon" notice afterwards.
    expect(prisma.sellerMembership.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // Claimed conditionally on the stamp still being unset, so two
        // overlapping sweeps can't both send.
        where: expect.objectContaining({
          expiredNoticeSentAt: null,
        }) as object,
        data: expect.objectContaining({
          expiredNoticeSentAt: expect.any(Date) as Date,
          expiryWarningSentAt: expect.any(Date) as Date,
        }) as object,
      }) as object,
    );
  });

  it('sends nothing when a concurrent sweep already claimed the notice', async () => {
    const { svc, prisma, notifications } = makeService();
    const expiresAt = new Date(Date.now() - DAY_MS);
    prisma.sellerMembership.findMany.mockResolvedValue([
      { id: 'm1', userId: 'u1', expiresAt, expiryWarningSentAt: null },
    ]);
    prisma.sellerMembership.groupBy.mockResolvedValue([
      { userId: 'u1', _max: { expiresAt } },
    ]);
    prisma.sellerMembership.updateMany.mockResolvedValue({ count: 0 });

    await expect(svc.sweep()).resolves.toEqual({ warned: 0, expired: 0 });
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('stays quiet when a later purchase already extended the window', async () => {
    const { svc, prisma, notifications } = makeService();
    // The old row looks expired, but the seller stacked a new plan on top —
    // memberships are separate rows, so only the latest speaks for the user.
    const oldRow = new Date(Date.now() - DAY_MS);
    const realExpiry = new Date(Date.now() + 300 * DAY_MS);
    prisma.sellerMembership.findMany.mockResolvedValue([
      { id: 'm1', userId: 'u1', expiresAt: oldRow, expiryWarningSentAt: null },
    ]);
    prisma.sellerMembership.groupBy.mockResolvedValue([
      { userId: 'u1', _max: { expiresAt: realExpiry } },
    ]);

    const result = await svc.sweep();

    expect(result).toEqual({ warned: 0, expired: 0 });
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('never lets a sweep failure take the process down', async () => {
    const { svc, prisma } = makeService();
    prisma.sellerMembership.findMany.mockRejectedValue(new Error('db gone'));
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await expect(svc.sweep()).resolves.toEqual({ warned: 0, expired: 0 });
  });
});
