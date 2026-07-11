import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Notification, NotificationType } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // tx lets callers create notifications inside a transaction (e.g. on sale).
  create(
    userId: string,
    type: NotificationType,
    message: string,
    listingId?: string | null,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return tx.notification.create({
      data: { userId, type, message, listingId: listingId ?? null },
    });
  }

  async listForUser(userId: string): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      listingId: n.listingId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { ok: true };
  }

  /** Notify every admin — used when a new order is placed. */
  async notifyAdmins(
    type: NotificationType,
    message: string,
    listingId: string | null,
    tx: Prisma.TransactionClient,
  ) {
    const admins = await tx.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    for (const a of admins) {
      await tx.notification.create({
        data: { userId: a.id, type, message, listingId },
      });
    }
  }
}
