import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { AdminDonationsController } from './admin-donations.controller';

@Module({
  imports: [NotificationsModule],
  providers: [DonationsService],
  controllers: [DonationsController, AdminDonationsController],
})
export class DonationsModule {}
