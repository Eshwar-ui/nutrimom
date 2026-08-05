import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  SettingsController,
  AdminSettingsController,
  AdminPayoutPolicyController,
  BusinessProfileController,
  AdminBusinessProfileController,
} from './settings.controller';

@Module({
  providers: [SettingsService],
  controllers: [
    SettingsController,
    AdminSettingsController,
    AdminPayoutPolicyController,
    BusinessProfileController,
    AdminBusinessProfileController,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
