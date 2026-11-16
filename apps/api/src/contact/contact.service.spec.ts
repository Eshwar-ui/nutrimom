import { NotFoundException } from '@nestjs/common';
import type { ContactMessageInput } from '@nutrimom/shared';
import { ContactService } from './contact.service';

function makeService() {
  const prisma = {
    contactMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    servicePackage: {
      findUnique: jest.fn(),
    },
  };
  const svc = new ContactService(prisma as any);
  return { svc, prisma };
}

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'm1',
  name: 'Asha',
  email: 'asha@example.com',
  phone: null,
  subject: 'Yoga sessions',
  message: 'I am 6 months pregnant and looking for prenatal yoga.',
  status: 'NEW',
  service: null,
  packageId: null,
  packageName: null,
  quotedPricePaise: null,
  createdAt: new Date('2026-09-23T10:00:00.000Z'),
  ...over,
});

/** A ServicePackage row as Prisma returns it. */
const pkg = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'pkg1',
  group: 'COMBO',
  name: 'Monthly Combo',
  pricePaise: 149900,
  offerPricePaise: null,
  offerLabel: null,
  offerEndsAt: null,
  isIntroductory: false,
  isActive: true,
  ...over,
});

const input = (
  over: Partial<ContactMessageInput> = {},
): ContactMessageInput => ({
  name: 'Asha',
  email: 'asha@example.com',
  subject: 'Yoga sessions',
  message: 'I am 6 months pregnant and looking for prenatal yoga.',
  ...over,
});

/** The row `submit` asked Prisma to create. */
function created(prisma: ReturnType<typeof makeService>['prisma']) {
  return (
    (prisma.contactMessage.create.mock.calls as unknown[][])[0][0] as {
      data: {
        service: string | null;
        phone: string | null;
        packageId: string | null;
        packageName: string | null;
        quotedPricePaise: number | null;
      };
    }
  ).data;
}

describe('ContactService', () => {
  describe('submit', () => {
    it('stores the service a booking CTA attributed the enquiry to', async () => {
      const { svc, prisma } = makeService();
      prisma.contactMessage.create.mockResolvedValue(row({ service: 'YOGA' }));

      await svc.submit(input({ service: 'YOGA' }));

      expect(created(prisma).service).toBe('YOGA');
    });

    it('stores null when the enquiry belongs to no service', async () => {
      // The footer's own contact link carries no `?service=`. Null has to
      // survive as null: defaulting it to a pillar would invent an
      // attribution and quietly inflate whichever pillar was chosen.
      const { svc, prisma } = makeService();
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit(input());

      expect(created(prisma).service).toBeNull();
    });

    it('normalises an empty phone to null rather than an empty string', async () => {
      const { svc, prisma } = makeService();
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit(input({ phone: '' }));

      expect(created(prisma).phone).toBeNull();
    });
  });

  describe('package snapshot', () => {
    it('stores the package name and its current regular price', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(pkg());
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit(input({ service: 'YOGA', packageId: 'pkg1' }));

      expect(prisma.servicePackage.findUnique).toHaveBeenCalledWith({
        where: { id: 'pkg1' },
      });
      expect(created(prisma)).toMatchObject({
        packageId: 'pkg1',
        packageName: 'Monthly Combo',
        quotedPricePaise: 149900,
      });
    });

    it('quotes the live offer price, computed by resolvePackagePrice', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(
        pkg({
          offerPricePaise: 119900,
          offerEndsAt: new Date(Date.now() + 86_400_000),
        }),
      );
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit(input({ packageId: 'pkg1' }));

      expect(created(prisma).quotedPricePaise).toBe(119900);
    });

    it('quotes the regular price once the offer has expired', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(
        pkg({
          offerPricePaise: 119900,
          offerEndsAt: new Date(Date.now() - 86_400_000),
        }),
      );
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit(input({ packageId: 'pkg1' }));

      expect(created(prisma).quotedPricePaise).toBe(149900);
    });

    it('ignores any price the client tries to send', async () => {
      // The schema strips unknown keys, but the guarantee must not rest on
      // that: the stored figure is always the server's own.
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(pkg());
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit({
        ...input({ packageId: 'pkg1' }),
        quotedPricePaise: 100,
        packageName: 'Free Combo',
      } as ContactMessageInput);

      expect(created(prisma)).toMatchObject({
        packageName: 'Monthly Combo',
        quotedPricePaise: 149900,
      });
    });

    it('still stores the message, without package fields, for an unknown id', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(null);
      prisma.contactMessage.create.mockResolvedValue(row());

      await expect(
        svc.submit(input({ packageId: 'stale-link' })),
      ).resolves.toEqual({ id: 'm1' });

      expect(created(prisma)).toMatchObject({
        packageId: null,
        packageName: null,
        quotedPricePaise: null,
      });
    });

    it('records no quote for an inactive package', async () => {
      const { svc, prisma } = makeService();
      prisma.servicePackage.findUnique.mockResolvedValue(
        pkg({ isActive: false }),
      );
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit(input({ packageId: 'pkg1' }));

      expect(created(prisma)).toMatchObject({
        packageId: null,
        packageName: null,
        quotedPricePaise: null,
      });
    });

    it('does not look anything up when no package was named', async () => {
      const { svc, prisma } = makeService();
      prisma.contactMessage.create.mockResolvedValue(row());

      await svc.submit(input());

      expect(prisma.servicePackage.findUnique).not.toHaveBeenCalled();
      expect(created(prisma).quotedPricePaise).toBeNull();
    });
  });

  describe('adminList', () => {
    it('carries the service through to the admin DTO', async () => {
      const { svc, prisma } = makeService();
      prisma.contactMessage.findMany.mockResolvedValue([
        row({ service: 'STARTING_SOLIDS' }),
        row({ id: 'm2', service: null }),
      ]);

      const list = await svc.adminList();

      expect(list.map((m) => m.service)).toEqual(['STARTING_SOLIDS', null]);
      expect(list[0].createdAt).toBe('2026-09-23T10:00:00.000Z');
    });

    it('carries the quoted package snapshot through to the admin DTO', async () => {
      const { svc, prisma } = makeService();
      prisma.contactMessage.findMany.mockResolvedValue([
        row({
          packageId: 'pkg1',
          packageName: 'Monthly Combo',
          quotedPricePaise: 149900,
        }),
      ]);

      const [message] = await svc.adminList();

      expect(message).toMatchObject({
        packageId: 'pkg1',
        packageName: 'Monthly Combo',
        quotedPricePaise: 149900,
      });
    });
  });

  describe('setStatus', () => {
    it('reports a missing message as not found', async () => {
      const { svc, prisma } = makeService();
      prisma.contactMessage.update.mockRejectedValue(new Error('P2025'));

      await expect(svc.setStatus('nope', 'READ')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
