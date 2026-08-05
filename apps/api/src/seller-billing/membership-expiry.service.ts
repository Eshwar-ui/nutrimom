import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// How far ahead a seller is warned that their listing window is closing.
const WARN_WITHIN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Warns sellers before — and once — their membership lapses. Without this a
 * paying seller's window closed in silence: `expiresAt` was only ever read at
 * gate-check time, so the first sign of expiry was being refused a listing.
 *
 * Runs at boot and every 6 hours on a plain unref'd interval, matching
 * ReservationSweeperService — no scheduler dependency, fine for the
 * single-instance deploy. Each notice is stamped on the membership row, so a
 * seller is told once per window rather than on every sweep.
 */
@Injectable()
export class MembershipExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MembershipExpiryService.name);
  private readonly intervalMs = 6 * 60 * 60 * 1000;
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    void this.sweep();
    this.timer = setInterval(() => void this.sweep(), this.intervalMs);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async sweep(): Promise<{ warned: number; expired: number }> {
    try {
      const now = new Date();
      const warnCutoff = new Date(now.getTime() + WARN_WITHIN_DAYS * DAY_MS);

      const candidates = await this.prisma.sellerMembership.findMany({
        where: {
          OR: [
            {
              expiresAt: { gt: now, lte: warnCutoff },
              expiryWarningSentAt: null,
            },
            { expiresAt: { lte: now }, expiredNoticeSentAt: null },
          ],
        },
      });
      if (candidates.length === 0) return { warned: 0, expired: 0 };

      // Membership purchases stack as separate rows, so an old row can look
      // "expiring" while a later purchase has already extended the seller's
      // real window. Only the user's latest-expiring row speaks for them.
      const latest = await this.prisma.sellerMembership.groupBy({
        by: ['userId'],
        where: { userId: { in: candidates.map((c) => c.userId) } },
        _max: { expiresAt: true },
      });
      const latestExpiry = new Map(
        latest.map((l) => [l.userId, l._max.expiresAt?.getTime()]),
      );

      let warned = 0;
      let expired = 0;

      for (const membership of candidates) {
        if (
          latestExpiry.get(membership.userId) !== membership.expiresAt.getTime()
        ) {
          continue; // superseded by a later purchase
        }

        if (membership.expiresAt <= now) {
          await this.notifications.create(
            membership.userId,
            'MEMBERSHIP_EXPIRED',
            'Your seller membership has expired, so you can no longer create new listings. Renew any time to start listing again.',
          );
          await this.prisma.sellerMembership.update({
            where: { id: membership.id },
            // Stamp both: a window that lapsed before the warning sweep could
            // reach it must not then emit a pointless "expiring soon" notice.
            data: {
              expiredNoticeSentAt: now,
              expiryWarningSentAt: membership.expiryWarningSentAt ?? now,
            },
          });
          expired++;
        } else {
          const days = Math.max(
            1,
            Math.ceil(
              (membership.expiresAt.getTime() - now.getTime()) / DAY_MS,
            ),
          );
          await this.notifications.create(
            membership.userId,
            'MEMBERSHIP_EXPIRING',
            `Your seller membership expires in ${days} day${days === 1 ? '' : 's'}. Renew to keep listing without a break.`,
          );
          await this.prisma.sellerMembership.update({
            where: { id: membership.id },
            data: { expiryWarningSentAt: now },
          });
          warned++;
        }
      }

      if (warned > 0 || expired > 0) {
        this.logger.log(
          `Membership sweep: ${warned} expiring warning(s), ${expired} expiry notice(s)`,
        );
      }
      return { warned, expired };
    } catch (err) {
      this.logger.warn(`Membership expiry sweep failed: ${String(err)}`);
      return { warned: 0, expired: 0 };
    }
  }
}
