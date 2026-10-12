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
  createdAt: new Date('2026-09-23T10:00:00.000Z'),
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
    prisma.contactMessage.create.mock.calls[0][0] as {
      data: { service: string | null; phone: string | null };
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
