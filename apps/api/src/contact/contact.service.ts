import { Injectable, NotFoundException } from '@nestjs/common';
import type { ContactMessage as ContactMessageRow } from '@prisma/client';
import type {
  ContactMessage,
  ContactMessageInput,
  ContactMessageStatus,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(input: ContactMessageInput): Promise<{ id: string }> {
    const row = await this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject,
        message: input.message,
      },
    });
    return { id: row.id };
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
    createdAt: row.createdAt.toISOString(),
  };
}
