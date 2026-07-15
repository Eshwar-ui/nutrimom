import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './payment-provider.interface';
import { RazorpayProvider } from './providers/razorpay.provider';
import type { Env } from '../config/env.validation';

@Module({
  imports: [OrdersModule, NotificationsModule],
  providers: [
    PaymentsService,
    RazorpayProvider,
    {
      // Selects the active gateway from PAYMENT_PROVIDER. Add a case (and an
      // adapter class) when a second gateway is introduced.
      provide: PAYMENT_PROVIDER,
      useFactory: (
        config: ConfigService<Env, true>,
        razorpay: RazorpayProvider,
      ): PaymentProvider => {
        const name = config.get('PAYMENT_PROVIDER', { infer: true });
        switch (name) {
          case 'razorpay':
            return razorpay;
          default:
            throw new Error(`Unsupported PAYMENT_PROVIDER: ${String(name)}`);
        }
      },
      inject: [ConfigService, RazorpayProvider],
    },
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
