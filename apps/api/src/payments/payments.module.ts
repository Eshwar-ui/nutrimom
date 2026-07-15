import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SellerBillingModule } from '../seller-billing/seller-billing.module';
import { PaymentProviderModule } from './payment-provider.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    OrdersModule,
    NotificationsModule,
    PaymentProviderModule,
    // For the shared webhook: one gateway URL settles both orders and seller
    // payments.
    SellerBillingModule,
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
