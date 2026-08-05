import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import {
  SHIPPING_PROVIDER,
  type ShippingProvider,
} from './shipping-provider.interface';
import { ManualLabelProvider } from './providers/manual-label.provider';
import { ShiprocketProvider } from './providers/shiprocket.provider';
import type { Env } from '../config/env.validation';

@Module({
  providers: [
    ShippingService,
    ManualLabelProvider,
    ShiprocketProvider,
    {
      // Selects the shipping provider from SHIPPING_PROVIDER. Add a case + an
      // adapter to support another courier aggregator.
      provide: SHIPPING_PROVIDER,
      useFactory: (
        config: ConfigService<Env, true>,
        manual: ManualLabelProvider,
        shiprocket: ShiprocketProvider,
      ): ShippingProvider => {
        const name = config.get('SHIPPING_PROVIDER', { infer: true });
        switch (name) {
          case 'manual':
            return manual;
          case 'shiprocket':
            return shiprocket;
          default:
            throw new Error(`Unsupported SHIPPING_PROVIDER: ${String(name)}`);
        }
      },
      inject: [ConfigService, ManualLabelProvider, ShiprocketProvider],
    },
  ],
  controllers: [ShippingController],
})
export class ShippingModule {}
