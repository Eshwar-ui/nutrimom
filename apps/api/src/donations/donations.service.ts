import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  DONATION_STATUS_LABELS,
  canMoveDonation,
  normaliseCity,
  type DonationOffer,
  type DonationOfferInput,
  type DonationStatus,
  type DonationStatusUpdateInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const withCategory = {
  category: true,
} satisfies Prisma.DonationOfferInclude;
type DonationRow = Prisma.DonationOfferGetPayload<{
  include: typeof withCategory;
}>;

/**
 * Donations are matched by hand: a mother offers an item, the admin contacts
 * her, finds a mom who needs it, and the handover happens off-platform. There
 * is no public listing and no money involved — this is a queue, not a shop.
 */
@Injectable()
export class DonationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    donorId: string,
    input: DonationOfferInput,
  ): Promise<DonationOffer> {
    const categoryId = input.categoryId || null;
    if (categoryId) {
      const exists = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!exists) {
        throw new BadRequestException(
          'That category no longer exists — choose another',
        );
      }
    }
    const city = normaliseCity(input.city);

    // One transaction: an offer the admins were never told about would sit
    // unseen in the queue, which is worse than the donor seeing an error and
    // submitting again.
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.donationOffer.create({
        data: {
          donorId,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          city,
          locality: input.locality || null,
          pincode: input.pincode,
          categoryId,
          itemsDescription: input.itemsDescription,
          condition: input.condition,
          images: input.images,
          handover: input.handover,
          status: 'NEW',
        },
        include: withCategory,
      });
      // No Notification column points at a donation, so it links through the
      // donor (relatedUserId — "who this is about"); the admin web app opens
      // the donation queue filtered to her offers.
      await this.notifications.notifyAdmins(
        'DONATION_OFFERED',
        `${input.contactName} in ${city} offered to donate: ${summarise(input.itemsDescription)}`,
        null,
        null,
        tx,
        donorId,
      );
      return created;
    });
    return toDonationDto(row);
  }

  async listMine(donorId: string): Promise<DonationOffer[]> {
    const rows = await this.prisma.donationOffer.findMany({
      where: { donorId },
      include: withCategory,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDonationDto);
  }

  async adminList(filter: {
    status?: DonationStatus;
    donorId?: string;
  }): Promise<DonationOffer[]> {
    const rows = await this.prisma.donationOffer.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.donorId ? { donorId: filter.donorId } : {}),
      },
      include: withCategory,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDonationDto);
  }

  async adminGet(id: string): Promise<DonationOffer> {
    const row = await this.prisma.donationOffer.findUnique({
      where: { id },
      include: withCategory,
    });
    if (!row) throw new NotFoundException('Donation not found');
    return toDonationDto(row);
  }

  /**
   * Move a donation along its lifecycle and/or update the admin's note.
   * Re-sending the current status changes only the note, which is allowed in
   * any state; a status change must follow DONATION_STATUS_TRANSITIONS.
   */
  async adminUpdate(
    id: string,
    dto: DonationStatusUpdateInput,
  ): Promise<DonationOffer> {
    const existing = await this.prisma.donationOffer.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) throw new NotFoundException('Donation not found');

    if (!canMoveDonation(existing.status, dto.status)) {
      const from = DONATION_STATUS_LABELS[existing.status];
      const to = DONATION_STATUS_LABELS[dto.status];
      throw new BadRequestException(
        existing.status === 'COMPLETED' || existing.status === 'DECLINED'
          ? `This donation is ${from.toLowerCase()} and can't be moved to ${to}.`
          : `A ${from.toLowerCase()} donation can't be moved to ${to}.`,
      );
    }

    // Guarded on the status just read, so two admins working the queue at
    // once can't both apply a move from the same starting point.
    const { count } = await this.prisma.donationOffer.updateMany({
      where: { id, status: existing.status },
      data: {
        status: dto.status,
        ...(dto.adminNote !== undefined
          ? { adminNote: dto.adminNote || null }
          : {}),
      },
    });
    if (count === 0) {
      throw new BadRequestException(
        'This donation was just updated by someone else — reload and try again.',
      );
    }
    return this.adminGet(id);
  }
}

function summarise(text: string, max = 80): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

export function toDonationDto(row: DonationRow): DonationOffer {
  return {
    id: row.id,
    donorId: row.donorId,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    city: row.city,
    locality: row.locality,
    pincode: row.pincode,
    categoryId: row.categoryId,
    category: row.category
      ? {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
        }
      : null,
    itemsDescription: row.itemsDescription,
    condition: row.condition,
    images: row.images,
    handover: row.handover,
    status: row.status,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
