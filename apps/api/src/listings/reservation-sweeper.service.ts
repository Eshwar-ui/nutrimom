import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Releases expired reservation holds. A listing reserved via `reserve()` gets a
 * 2-day `reservedUntil`; without this sweep an abandoned hold would strand the
 * item as RESERVED forever. Runs at boot and every 10 minutes. No scheduler
 * dependency — a plain unref'd interval (fine for the single-instance deploy).
 */
@Injectable()
export class ReservationSweeperService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReservationSweeperService.name);
  private readonly intervalMs = 10 * 60 * 1000;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.sweep();
    this.timer = setInterval(() => void this.sweep(), this.intervalMs);
    // Don't keep the process alive just for the sweeper.
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async sweep(): Promise<number> {
    try {
      const { count } = await this.prisma.listing.updateMany({
        where: { status: 'RESERVED', reservedUntil: { lt: new Date() } },
        data: { status: 'APPROVED', reservedById: null, reservedUntil: null },
      });
      if (count > 0) {
        this.logger.log(`Released ${count} expired reservation hold(s)`);
      }
      return count;
    } catch (err) {
      this.logger.warn(`Reservation sweep failed: ${String(err)}`);
      return 0;
    }
  }
}
