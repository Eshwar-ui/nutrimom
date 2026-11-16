import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestimonialInput } from '@nutrimom/shared';
import {
  CONSENT_REQUIRED_MESSAGE,
  TestimonialsService,
} from './testimonials.service';

function makeService() {
  const prisma = {
    testimonial: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const svc = new TestimonialsService(prisma as any);
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
  id: 't1',
  name: 'Priya',
  context: 'Prenatal yoga · Hyderabad',
  quote: 'The sessions kept me calm all through my third trimester.',
  photoUrl: null,
  consentConfirmed: true,
  isPublished: true,
  sortOrder: 0,
  createdAt: T,
  updatedAt: T,
  ...over,
});

const input = (over: Partial<TestimonialInput> = {}): TestimonialInput => ({
  name: 'Priya',
  context: 'Prenatal yoga · Hyderabad',
  quote: 'The sessions kept me calm all through my third trimester.',
  consentConfirmed: true,
  isPublished: true,
  sortOrder: 0,
  ...over,
});

describe('TestimonialsService', () => {
  describe('publicList', () => {
    it('requires both published and consented', async () => {
      const { svc, prisma } = makeService();
      prisma.testimonial.findMany.mockResolvedValue([row()]);

      await svc.publicList();

      expect(callArg<FindManyArgs>(prisma.testimonial.findMany).where).toEqual({
        isPublished: true,
        consentConfirmed: true,
      });
    });
  });

  describe('adminList', () => {
    it('includes drafts and unconsented rows', async () => {
      const { svc, prisma } = makeService();
      prisma.testimonial.findMany.mockResolvedValue([
        row(),
        row({ id: 't2', consentConfirmed: false, isPublished: false }),
      ]);

      const list = await svc.adminList();

      expect(
        callArg<FindManyArgs>(prisma.testimonial.findMany).where,
      ).toBeUndefined();
      expect(list).toHaveLength(2);
    });
  });

  describe('consent rule', () => {
    it('refuses to create a published testimonial without consent', async () => {
      const { svc, prisma } = makeService();

      const attempt = svc.create(
        input({ consentConfirmed: false, isPublished: true }),
      );

      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      await expect(attempt).rejects.toThrow(CONSENT_REQUIRED_MESSAGE);
      expect(prisma.testimonial.create).not.toHaveBeenCalled();
    });

    it('refuses to publish an existing testimonial without consent', async () => {
      const { svc, prisma } = makeService();

      await expect(
        svc.update('t1', input({ consentConfirmed: false, isPublished: true })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.testimonial.update).not.toHaveBeenCalled();
    });

    it('allows saving an unconsented draft', async () => {
      // Consent can arrive after the words do — the admin must be able to
      // park the quote until the mother's permission comes back.
      const { svc, prisma } = makeService();
      prisma.testimonial.create.mockResolvedValue(
        row({ consentConfirmed: false, isPublished: false }),
      );

      const saved = await svc.create(
        input({ consentConfirmed: false, isPublished: false }),
      );

      expect(saved.isPublished).toBe(false);
    });

    it('allows publishing once consent is confirmed', async () => {
      const { svc, prisma } = makeService();
      prisma.testimonial.update.mockResolvedValue(row());

      await svc.update('t1', input());

      expect(callArg<WriteArgs>(prisma.testimonial.update).data).toMatchObject({
        consentConfirmed: true,
        isPublished: true,
      });
    });
  });

  describe('writes', () => {
    it('stores cleared optional fields as null', async () => {
      const { svc, prisma } = makeService();
      prisma.testimonial.create.mockResolvedValue(row());

      await svc.create(input({ context: '', photoUrl: '' }));

      const { data } = callArg<WriteArgs>(prisma.testimonial.create);
      expect(data.context).toBeNull();
      expect(data.photoUrl).toBeNull();
    });

    it('reports an unknown testimonial as not found', async () => {
      const { svc, prisma } = makeService();
      prisma.testimonial.update.mockRejectedValue({ code: 'P2025' });
      prisma.testimonial.delete.mockRejectedValue({ code: 'P2025' });

      await expect(svc.update('nope', input())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(svc.remove('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
