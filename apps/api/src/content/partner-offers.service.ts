import { Injectable, NotFoundException } from '@nestjs/common';
import type { PartnerOffer as PartnerOfferRow } from '@prisma/client';
import type { PartnerOffer, PartnerOfferInput } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { blankToNull, isoToDate, isRecordNotFound } from './content-utils';

const ORDER = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

@Injectable()
export class PartnerOffersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public ----

  /**
   * Active and unexpired only. Expiry is filtered here, at read time, rather
   * than by a job flipping isActive — so an expired code disappears the moment
   * it lapses and can never be shown by accident while a job is late.
   */
  async publicList(now: Date = new Date()): Promise<PartnerOffer[]> {
    const rows = await this.prisma.partnerOffer.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: ORDER,
    });
    return rows.map(toDto);
  }

  // ---- Admin ----

  /** Everything, expired included — the admin needs to see what lapsed. */
  async adminList(): Promise<PartnerOffer[]> {
    const rows = await this.prisma.partnerOffer.findMany({ orderBy: ORDER });
    return rows.map(toDto);
  }

  async create(input: PartnerOfferInput): Promise<PartnerOffer> {
    const row = await this.prisma.partnerOffer.create({ data: toData(input) });
    return toDto(row);
  }

  async update(id: string, input: PartnerOfferInput): Promise<PartnerOffer> {
    const row = await this.prisma.partnerOffer
      .update({ where: { id }, data: toData(input) })
      .catch((err: unknown) => {
        if (isRecordNotFound(err))
          throw new NotFoundException('Offer not found');
        throw err;
      });
    return toDto(row);
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.prisma.partnerOffer
      .delete({ where: { id } })
      .catch((err: unknown) => {
        if (isRecordNotFound(err))
          throw new NotFoundException('Offer not found');
        throw err;
      });
    return { id };
  }
}

function toData(input: PartnerOfferInput) {
  return {
    brandName: input.brandName,
    logoUrl: blankToNull(input.logoUrl),
    description: input.description,
    benefit: input.benefit,
    couponCode: blankToNull(input.couponCode),
    url: input.url,
    isAffiliate: input.isAffiliate,
    expiresAt: isoToDate(input.expiresAt),
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };
}

function toDto(row: PartnerOfferRow): PartnerOffer {
  return {
    id: row.id,
    brandName: row.brandName,
    logoUrl: row.logoUrl,
    description: row.description,
    benefit: row.benefit,
    couponCode: row.couponCode,
    url: row.url,
    isAffiliate: row.isAffiliate,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
