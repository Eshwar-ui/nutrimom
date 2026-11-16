import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, SiteContent as SiteContentRow } from '@prisma/client';
import {
  founderSchema,
  galleryImageSchema,
  type Founder,
  type GalleryImage,
  type SiteContent,
  type SiteContentInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { blankToNull } from './content-utils';

// Singleton, like BusinessProfile. The redesign migration inserts the row.
const SITE_CONTENT_ID = 'global';

@Injectable()
export class SiteContentService {
  private readonly logger = new Logger(SiteContentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Public — the layout (footer socials), home, About and contact read it. */
  async get(): Promise<SiteContent> {
    const row = await this.prisma.siteContent.findUnique({
      where: { id: SITE_CONTENT_ID },
    });
    if (!row) throw new NotFoundException('Site content not found');
    return this.toDto(row);
  }

  /**
   * Full replace of the editable copy. founders / galleryImages have already
   * been validated entry by entry by siteContentInputSchema (the shared
   * founderSchema / galleryImageSchema), so what lands in the JSON columns is
   * always a shape the public pages can render.
   *
   * Upsert rather than update so a database restored without the migration's
   * seed row can still be set up from the admin panel.
   */
  async update(input: SiteContentInput): Promise<SiteContent> {
    const data = toData(input);
    const row = await this.prisma.siteContent.upsert({
      where: { id: SITE_CONTENT_ID },
      create: { id: SITE_CONTENT_ID, ...data },
      update: data,
    });
    return this.toDto(row);
  }

  private toDto(row: SiteContentRow): SiteContent {
    return {
      heroHeadline: row.heroHeadline,
      heroSubline: row.heroSubline,
      heroMessage: row.heroMessage,
      heroImageUrl: row.heroImageUrl,
      heroImageAlt: row.heroImageAlt,
      aboutMission: row.aboutMission,
      founders: this.parseEntries(row.founders, 'founders', (v) => {
        const parsed = founderSchema.safeParse(v);
        return parsed.success ? normaliseFounder(parsed.data) : null;
      }),
      galleryImages: this.parseEntries(
        row.galleryImages,
        'galleryImages',
        (v) => {
          const parsed = galleryImageSchema.safeParse(v);
          return parsed.success ? normaliseGalleryImage(parsed.data) : null;
        },
      ),
      instagramUrl: row.instagramUrl,
      youtubeUrl: row.youtubeUrl,
      whatsappCommunityUrl: row.whatsappCommunityUrl,
      whatsappPrelovedUrl: row.whatsappPrelovedUrl,
      sessionPolicy: row.sessionPolicy,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Reads a JSON column defensively. Every write goes through the shared
   * schemas, but this feeds the public layout: one hand-edited bad entry must
   * drop out (and be logged), not take every page that renders the footer
   * down with a 500.
   */
  private parseEntries<T>(
    value: Prisma.JsonValue,
    column: string,
    parse: (entry: unknown) => T | null,
  ): T[] {
    if (!Array.isArray(value)) {
      this.logger.warn(`SiteContent.${column} is not an array — ignoring it`);
      return [];
    }
    const out: T[] = [];
    value.forEach((entry, index) => {
      const parsed = parse(entry);
      if (parsed) out.push(parsed);
      else
        this.logger.warn(
          `SiteContent.${column}[${index}] is malformed — skipped`,
        );
    });
    return out;
  }
}

type FounderEntry = SiteContentInput['founders'][number];
type GalleryEntry = SiteContentInput['galleryImages'][number];

function normaliseFounder(f: FounderEntry): Founder {
  return {
    name: f.name,
    role: f.role,
    photoUrl: blankToNull(f.photoUrl),
    bio: f.bio,
    qualifications: f.qualifications,
  };
}

function normaliseGalleryImage(g: GalleryEntry): GalleryImage {
  return { url: g.url, alt: g.alt, caption: blankToNull(g.caption) };
}

function toData(input: SiteContentInput) {
  const heroImageUrl = blankToNull(input.heroImageUrl);
  return {
    heroHeadline: input.heroHeadline,
    heroSubline: input.heroSubline,
    heroMessage: input.heroMessage,
    heroImageUrl,
    // Alt text without an image would describe nothing; drop it with the image.
    heroImageAlt: heroImageUrl ? blankToNull(input.heroImageAlt) : null,
    aboutMission: blankToNull(input.aboutMission),
    // Plain JSON by construction: the normalisers emit null, never undefined,
    // for an absent photo or caption. The cast is only because the shared
    // interfaces mark those fields optional.
    founders: input.founders.map(
      normaliseFounder,
    ) as unknown as Prisma.InputJsonValue,
    galleryImages: input.galleryImages.map(
      normaliseGalleryImage,
    ) as unknown as Prisma.InputJsonValue,
    instagramUrl: blankToNull(input.instagramUrl),
    youtubeUrl: blankToNull(input.youtubeUrl),
    whatsappCommunityUrl: blankToNull(input.whatsappCommunityUrl),
    whatsappPrelovedUrl: blankToNull(input.whatsappPrelovedUrl),
    sessionPolicy: blankToNull(input.sessionPolicy),
  };
}
