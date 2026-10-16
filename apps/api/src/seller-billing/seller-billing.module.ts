import { Module } from '@nestjs/common';
import { PaymentProviderModule } from '../payments/payment-provider.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { SellerBillingService } from './seller-billing.service';
import { MembershipExpiryService } from './membership-expiry.service';
import { SellerBillingController } from './seller-billing.controller';

@Module({
  imports: [PaymentProviderModule, NotificationsModule, MailModule],
  providers: [SellerBillingService, MembershipExpiryService],
  controllers: [SellerBillingController],
  // Exported so the shared gateway webhook (in PaymentsController) can also
  // settle seller payments.
  exports: [SellerBillingService],
})
export class SellerBillingModule {}
