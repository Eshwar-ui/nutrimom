import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './payment-provider.interface';
import { RazorpayProvider } from './providers/razorpay.provider';
import type { Env } from '../config/env.validation';

/**
 * Provides the single active gateway adapter (selected by PAYMENT_PROVIDER) and
 * exports the PAYMENT_PROVIDER token. Imported by both PaymentsModule (order
 * payments) and SellerBillingModule (registration + membership) so they share
 * one provider. Add a case + adapter here to support another gateway.
 */
@Module({
  providers: [
    RazorpayProvider,
    {
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
  exports: [PAYMENT_PROVIDER],
})
export class PaymentProviderModule {}
