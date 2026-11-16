import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ServicePackage as ServicePackageRow } from '@prisma/client';
import type {
  ServiceGroup,
  ServicePackage,
  ServicePackageInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { blankToNull, isoToDate, isRecordNotFound } from './content-utils';

// Enum order (the order the groups are declared in schema.prisma) is the page
// order, so sorting on `group` lays the cards out the way the pages read.
const ORDER = [
  { group: 'asc' as const },
  { sortOrder: 'asc' as const },
  { createdAt: 'asc' as const },
];

@Injectable()
export class ServicePackagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public ----

  /** Active packages only — an inactive package is a draft, not a price. */
  async publicList(group?: ServiceGroup): Promise<ServicePackage[]> {
    const rows = await this.prisma.servicePackage.findMany({
      where: group ? { isActive: true, group } : { isActive: true },
      orderBy: ORDER,
    });
    return rows.map(toDto);
  }

  // ---- Admin ----

  async adminList(): Promise<ServicePackage[]> {
    const rows = await this.prisma.servicePackage.findMany({ orderBy: ORDER });
    return rows.map(toDto);
  }

  async create(input: ServicePackageInput): Promise<ServicePackage> {
    assertPricingRules(input);
    const row = await this.prisma.servicePackage.create({
      // A new package's regular price starts its clock now.
      data: { ...toData(input), priceSince: new Date() },
    });
    return toDto(row);
  }

  /**
   * Full replace. priceSince moves only when the regular price itself changes:
   * editing an offer, the copy or the sort order must not reset the date the
   * "was ₹X" figure is judged against (offerSavingsWarning), or every edit
   * would make a genuine regular price look brand new.
   */
  async update(
    id: string,
    input: ServicePackageInput,
  ): Promise<ServicePackage> {
    assertPricingRules(input);
    const existing = await this.prisma.servicePackage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Package not found');

    const priceChanged = existing.pricePaise !== input.pricePaise;
    const row = await this.prisma.servicePackage
      .update({
        where: { id },
        data: {
          ...toData(input),
          ...(priceChanged ? { priceSince: new Date() } : {}),
        },
      })
      .catch((err: unknown) => {
        // Deleted between the read and the write.
        if (isRecordNotFound(err))
          throw new NotFoundException('Package not found');
        throw err;
      });
    return toDto(row);
  }

  /**
   * Hard delete. Enquiries that quoted this package keep their own snapshot
   * (ContactMessage.packageName / quotedPricePaise), so nothing is lost —
   * though setting isActive=false is the gentler way to retire a package.
   */
  async remove(id: string): Promise<{ id: string }> {
    await this.prisma.servicePackage
      .delete({ where: { id } })
      .catch((err: unknown) => {
        if (isRecordNotFound(err))
          throw new NotFoundException('Package not found');
        throw err;
      });
    return { id };
  }
}

/**
 * Re-checks the two rules servicePackageInputSchema already refines on. The
 * schema is the first line; this is the one that holds if a caller ever
 * reaches the service without it, because what these rows feed is a price
 * shown to the public.
 */
function assertPricingRules(input: ServicePackageInput): void {
  if (input.offerPricePaise != null && input.isIntroductory) {
    throw new BadRequestException(
      "An introductory price can't also have a special offer — remove one of them",
    );
  }
  if (
    input.offerPricePaise != null &&
    input.offerPricePaise >= input.pricePaise
  ) {
    throw new BadRequestException(
      'The offer price must be lower than the regular price',
    );
  }
}

/** Full-replace mapping: an omitted optional field is cleared, not kept. */
function toData(input: ServicePackageInput) {
  return {
    group: input.group,
    name: input.name,
    summary: input.summary,
    includes: input.includes,
    sessionCount: input.sessionCount ?? null,
    sessionMinutes: input.sessionMinutes ?? null,
    validityDays: input.validityDays ?? null,
    format: input.format,
    pricePaise: input.pricePaise,
    offerPricePaise: input.offerPricePaise ?? null,
    offerLabel: blankToNull(input.offerLabel),
    offerEndsAt: isoToDate(input.offerEndsAt),
    isIntroductory: input.isIntroductory,
    isBestValue: input.isBestValue,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };
}

function toDto(row: ServicePackageRow): ServicePackage {
  return {
    id: row.id,
    group: row.group,
    name: row.name,
    summary: row.summary,
    includes: row.includes,
    sessionCount: row.sessionCount,
    sessionMinutes: row.sessionMinutes,
    validityDays: row.validityDays,
    format: row.format,
    pricePaise: row.pricePaise,
    priceSince: row.priceSince.toISOString(),
    offerPricePaise: row.offerPricePaise,
    offerLabel: row.offerLabel,
    offerEndsAt: row.offerEndsAt?.toISOString() ?? null,
    isIntroductory: row.isIntroductory,
    isBestValue: row.isBestValue,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
