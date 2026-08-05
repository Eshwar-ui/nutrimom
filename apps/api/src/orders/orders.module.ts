import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentProviderModule } from '../payments/payment-provider.module';
import { SettingsModule } from '../settings/settings.module';
import { PayoutsModule } from '../payouts/payouts.module';
import { OrdersService } from './orders.service';
import { OrdersController, AdminOrdersController } from './orders.controller';

@Module({
  imports: [
    NotificationsModule,
    PaymentProviderModule,
    SettingsModule,
    PayoutsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController, AdminOrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
