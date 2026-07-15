import { Module } from '@nestjs/common';
import { PaymentProviderModule } from '../payments/payment-provider.module';
import { SellerBillingService } from './seller-billing.service';
import { SellerBillingController } from './seller-billing.controller';

@Module({
  imports: [PaymentProviderModule],
  providers: [SellerBillingService],
  controllers: [SellerBillingController],
  // Exported so the shared gateway webhook (in PaymentsController) can also
  // settle seller payments.
  exports: [SellerBillingService],
})
export class SellerBillingModule {}
