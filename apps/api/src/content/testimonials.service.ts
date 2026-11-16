import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Testimonial as TestimonialRow } from '@prisma/client';
import type { Testimonial, TestimonialInput } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { blankToNull, isRecordNotFound } from './content-utils';

const ORDER = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

export const CONSENT_REQUIRED_MESSAGE =
  "Confirm you have the mother's written permission before publishing this testimonial";

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public ----

  /**
   * Published AND consented. Both flags, not just isPublished: the write path
   * refuses a published row without consent, but the read is the last line —
   * a row that somehow got one flag without the other still stays private.
   */
  async publicList(): Promise<Testimonial[]> {
    const rows = await this.prisma.testimonial.findMany({
      where: { isPublished: true, consentConfirmed: true },
      orderBy: ORDER,
    });
    return rows.map(toDto);
  }

  // ---- Admin ----

  async adminList(): Promise<Testimonial[]> {
    const rows = await this.prisma.testimonial.findMany({ orderBy: ORDER });
    return rows.map(toDto);
  }

  async create(input: TestimonialInput): Promise<Testimonial> {
    assertConsent(input);
    const row = await this.prisma.testimonial.create({ data: toData(input) });
    return toDto(row);
  }

  async update(id: string, input: TestimonialInput): Promise<Testimonial> {
    assertConsent(input);
    const row = await this.prisma.testimonial
      .update({ where: { id }, data: toData(input) })
      .catch((err: unknown) => {
        if (isRecordNotFound(err))
          throw new NotFoundException('Testimonial not found');
        throw err;
      });
    return toDto(row);
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.prisma.testimonial
      .delete({ where: { id } })
      .catch((err: unknown) => {
        if (isRecordNotFound(err))
          throw new NotFoundException('Testimonial not found');
        throw err;
      });
    return { id };
  }
}

/**
 * The brief forbids publishing a testimonial without the mother's permission.
 * testimonialInputSchema refines on the same rule; this re-check is what holds
 * if the service is ever reached without that schema in front of it.
 */
function assertConsent(input: TestimonialInput): void {
  if (input.isPublished && !input.consentConfirmed) {
    throw new BadRequestException(CONSENT_REQUIRED_MESSAGE);
  }
}

function toData(input: TestimonialInput) {
  return {
    name: input.name,
    context: blankToNull(input.context),
    quote: input.quote,
    photoUrl: blankToNull(input.photoUrl),
    consentConfirmed: input.consentConfirmed,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder,
  };
}

function toDto(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    name: row.name,
    context: row.context,
    quote: row.quote,
    photoUrl: row.photoUrl,
    consentConfirmed: row.consentConfirmed,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
