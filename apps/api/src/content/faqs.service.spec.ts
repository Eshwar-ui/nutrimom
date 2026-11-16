import { NotFoundException } from '@nestjs/common';
import type { FaqInput } from '@nutrimom/shared';
import { FaqsService } from './faqs.service';

function makeService() {
  const prisma = {
    faq: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const svc = new FaqsService(prisma as any);
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
  id: 'f1',
  section: 'SESSIONS',
  question: 'Are the yoga sessions live?',
  answer: 'Yes — **live** on Zoom.',
  sortOrder: 0,
  isPublished: true,
  createdAt: T,
  updatedAt: T,
  ...over,
});

const input = (over: Partial<FaqInput> = {}): FaqInput => ({
  section: 'SESSIONS',
  question: 'Are the yoga sessions live?',
  answer: 'Yes — **live** on Zoom.',
  sortOrder: 0,
  isPublished: true,
  ...over,
});

describe('FaqsService', () => {
  describe('publicList', () => {
    it('returns published answers only, by section then sort order', async () => {
      const { svc, prisma } = makeService();
      prisma.faq.findMany.mockResolvedValue([row()]);

      const list = await svc.publicList();

      const args = callArg<FindManyArgs>(prisma.faq.findMany);
      expect(args.where).toEqual({ isPublished: true });
      expect(args.orderBy).toEqual([
        { section: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ]);
      expect(list[0].createdAt).toBe(T.toISOString());
    });

    it('narrows to one section when asked', async () => {
      const { svc, prisma } = makeService();
      prisma.faq.findMany.mockResolvedValue([]);

      await svc.publicList('NUTRITION');

      expect(callArg<FindManyArgs>(prisma.faq.findMany).where).toEqual({
        isPublished: true,
        section: 'NUTRITION',
      });
    });
  });

  describe('adminList', () => {
    it('includes unpublished drafts', async () => {
      const { svc, prisma } = makeService();
      prisma.faq.findMany.mockResolvedValue([
        row(),
        row({ id: 'f2', isPublished: false }),
      ]);

      const list = await svc.adminList();

      expect(callArg<FindManyArgs>(prisma.faq.findMany).where).toBeUndefined();
      expect(list.map((f) => f.isPublished)).toEqual([true, false]);
    });
  });

  describe('writes', () => {
    it('creates with exactly the editable fields', async () => {
      const { svc, prisma } = makeService();
      prisma.faq.create.mockResolvedValue(row());

      await svc.create(input({ isPublished: false }));

      expect(callArg<WriteArgs>(prisma.faq.create).data).toEqual({
        section: 'SESSIONS',
        question: 'Are the yoga sessions live?',
        answer: 'Yes — **live** on Zoom.',
        sortOrder: 0,
        isPublished: false,
      });
    });

    it('reports an unknown FAQ as not found on update', async () => {
      const { svc, prisma } = makeService();
      prisma.faq.update.mockRejectedValue({ code: 'P2025' });

      await expect(svc.update('nope', input())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('reports an unknown FAQ as not found on delete', async () => {
      const { svc, prisma } = makeService();
      prisma.faq.delete.mockRejectedValue({ code: 'P2025' });

      await expect(svc.remove('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('does not disguise an unrelated failure as not found', async () => {
      const { svc, prisma } = makeService();
      const fault = new Error('connection reset');
      prisma.faq.delete.mockRejectedValue(fault);

      await expect(svc.remove('f1')).rejects.toBe(fault);
    });
  });
});
