import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { PayoutsService } from './payouts.service';
import {
  AdminPayoutsController,
  SellerPayoutsController,
} from './payouts.controller';

@Module({
  imports: [SettingsModule],
  providers: [PayoutsService],
  controllers: [SellerPayoutsController, AdminPayoutsController],
  exports: [PayoutsService],
})
export class PayoutsModule {}
