import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ListingsService } from './listings.service';
import { ListingsController, SellersController } from './listings.controller';
import { SellerListingsController } from './seller-listings.controller';
import { AdminListingsController } from './admin-listings.controller';

@Module({
  imports: [NotificationsModule],
  providers: [ListingsService],
  controllers: [
    ListingsController,
    SellersController,
    SellerListingsController,
    AdminListingsController,
  ],
  exports: [ListingsService],
})
export class ListingsModule {}
