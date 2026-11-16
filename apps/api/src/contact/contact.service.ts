import { Injectable, NotFoundException } from '@nestjs/common';
import type { ContactMessage as ContactMessageRow } from '@prisma/client';
import {
  resolvePackagePrice,
  type ContactMessage,
  type ContactMessageInput,
  type ContactMessageStatus,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(input: ContactMessageInput): Promise<{ id: string }> {
    const quote = await this.quotedPackage(input.packageId);
    const row = await this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject,
        message: input.message,
        service: input.service ?? null,
        packageId: quote?.packageId ?? null,
        packageName: quote?.packageName ?? null,
        quotedPricePaise: quote?.quotedPricePaise ?? null,
      },
    });
    return { id: row.id };
  }

  /**
   * Snapshots the package an enquiry is about and what it costs right now,
   * so the admin sees exactly the price the mother was shown even if it is
   * edited later. The price is always computed here by resolvePackagePrice —
   * the same function the price card and the WhatsApp message use — and never
   * taken from the client, which only ever sends the id.
   *
   * An unknown or inactive package is not a reason to lose the message: the
   * enquiry is stored without any package fields, exactly like one sent from
   * the plain contact link. Recording an inactive package's price would quote
   * a price that is not on offer.
   */
  private async quotedPackage(packageId: string | undefined) {
    if (!packageId) return null;
    const pkg = await this.prisma.servicePackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg || !pkg.isActive) return null;
    return {
      packageId: pkg.id,
      packageName: pkg.name,
      quotedPricePaise: resolvePackagePrice(pkg).pricePaise,
    };
  }

  async adminList(): Promise<ContactMessage[]> {
    const rows = await this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  }

  async setStatus(
    id: string,
    status: ContactMessageStatus,
  ): Promise<ContactMessage> {
    const row = await this.prisma.contactMessage
      .update({ where: { id }, data: { status } })
      .catch(() => {
        throw new NotFoundException('Message not found');
      });
    return toDto(row);
  }
}

function toDto(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    service: row.service,
    packageId: row.packageId,
    packageName: row.packageName,
    quotedPricePaise: row.quotedPricePaise,
    createdAt: row.createdAt.toISOString(),
  };
}
