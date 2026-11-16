import { Logger, NotFoundException } from '@nestjs/common';
import type { SiteContentInput } from '@nutrimom/shared';
import { SiteContentService } from './site-content.service';

function makeService() {
  const prisma = {
    siteContent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const svc = new SiteContentService(prisma as any);
  return { svc, prisma };
}

/** First argument of the nth call, typed — keeps assertions off `any`. */
function callArg<T>(fn: jest.Mock, nth = 0): T {
  return (fn.mock.calls as unknown as [T][])[nth][0];
}

type UpsertArgs = {
  where: unknown;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

// Silence the malformed-entry warnings these tests provoke on purpose.
beforeEach(() => {
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

const T = new Date('2026-11-11T00:00:00.000Z');

const founder = {
  name: 'Anjali Rao',
  role: 'Co-founder · Prenatal yoga',
  photoUrl: null,
  bio: 'Certified prenatal yoga teacher and mother of two.',
  qualifications: ['RYT-200'],
};

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'global',
  heroHeadline: 'From pregnancy to toddlerhood, you’re not alone.',
  heroSubline: 'A nurturing space for every mother.',
  heroMessage: 'Move, nourish, connect and grow together.',
  heroImageUrl: null,
  heroImageAlt: null,
  aboutMission: null,
  founders: [],
  galleryImages: [],
  instagramUrl: 'https://www.instagram.com/thenurturemoms',
  youtubeUrl: null,
  whatsappCommunityUrl: null,
  whatsappPrelovedUrl: null,
  sessionPolicy: null,
  updatedAt: T,
  ...over,
});

const input = (over: Partial<SiteContentInput> = {}): SiteContentInput => ({
  heroHeadline: 'From pregnancy to toddlerhood, you’re not alone.',
  heroSubline: 'A nurturing space for every mother.',
  heroMessage: 'Move, nourish, connect and grow together.',
  founders: [],
  galleryImages: [],
  ...over,
});

describe('SiteContentService', () => {
  describe('get', () => {
    it('reads the global row', async () => {
      const { svc, prisma } = makeService();
      prisma.siteContent.findUnique.mockResolvedValue(row());

      const content = await svc.get();

      expect(prisma.siteContent.findUnique).toHaveBeenCalledWith({
        where: { id: 'global' },
      });
      expect(content.updatedAt).toBe(T.toISOString());
      expect(content.founders).toEqual([]);
    });

    it('reports a missing row as not found rather than crashing', async () => {
      const { svc, prisma } = makeService();
      prisma.siteContent.findUnique.mockResolvedValue(null);

      await expect(svc.get()).rejects.toBeInstanceOf(NotFoundException);
    });

    it('drops a malformed JSON entry instead of failing the whole read', async () => {
      // This feeds the footer on every page: one bad hand-edited entry must
      // not 500 the site.
      const { svc, prisma } = makeService();
      prisma.siteContent.findUnique.mockResolvedValue(
        row({
          founders: [founder, { name: 'x' }],
          galleryImages: [
            {
              url: 'https://cdn.example.com/a.jpg',
              alt: 'Mothers at a yoga meetup',
            },
            { url: 'not a url', alt: 'broken' },
          ],
        }),
      );

      const content = await svc.get();

      expect(content.founders).toEqual([founder]);
      expect(content.galleryImages).toEqual([
        {
          url: 'https://cdn.example.com/a.jpg',
          alt: 'Mothers at a yoga meetup',
          caption: null,
        },
      ]);
    });

    it('treats a non-array JSON column as empty', async () => {
      const { svc, prisma } = makeService();
      prisma.siteContent.findUnique.mockResolvedValue(row({ founders: {} }));

      await expect(svc.get()).resolves.toMatchObject({ founders: [] });
    });
  });

  describe('update', () => {
    it('upserts the global row with blanks stored as null', async () => {
      const { svc, prisma } = makeService();
      prisma.siteContent.upsert.mockResolvedValue(row());

      await svc.update(
        input({
          instagramUrl: '',
          aboutMission: '',
          sessionPolicy: null,
          founders: [{ ...founder, photoUrl: '' }],
          galleryImages: [
            {
              url: 'https://cdn.example.com/a.jpg',
              alt: 'Yoga meetup',
              caption: '',
            },
          ],
        }),
      );

      const args = callArg<UpsertArgs>(prisma.siteContent.upsert);
      expect(args.where).toEqual({ id: 'global' });
      expect(args.create.id).toBe('global');
      expect(args.update.instagramUrl).toBeNull();
      expect(args.update.aboutMission).toBeNull();
      expect(args.update.sessionPolicy).toBeNull();
      expect(args.update.founders).toEqual([{ ...founder, photoUrl: null }]);
      expect(args.update.galleryImages).toEqual([
        {
          url: 'https://cdn.example.com/a.jpg',
          alt: 'Yoga meetup',
          caption: null,
        },
      ]);
    });

    it('drops the hero alt text when the image is removed', async () => {
      const { svc, prisma } = makeService();
      prisma.siteContent.upsert.mockResolvedValue(row());

      await svc.update(
        input({ heroImageUrl: '', heroImageAlt: 'A mother and baby' }),
      );

      const { update } = callArg<UpsertArgs>(prisma.siteContent.upsert);
      expect(update.heroImageUrl).toBeNull();
      expect(update.heroImageAlt).toBeNull();
    });

    it('keeps the hero alt text with its image', async () => {
      const { svc, prisma } = makeService();
      prisma.siteContent.upsert.mockResolvedValue(row());

      await svc.update(
        input({
          heroImageUrl: 'https://cdn.example.com/hero.jpg',
          heroImageAlt: 'A mother holding her baby',
        }),
      );

      const { update } = callArg<UpsertArgs>(prisma.siteContent.upsert);
      expect(update.heroImageUrl).toBe('https://cdn.example.com/hero.jpg');
      expect(update.heroImageAlt).toBe('A mother holding her baby');
    });
  });
});
