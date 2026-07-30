import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  Role,
  cancellationPolicyInputSchema,
  type CancellationPolicyInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SettingsService } from './settings.service';

// Readable by any signed-in user — the buyer cancel dialog needs the
// current reason codes/cutoff, not just the admin settings page.
@Controller('cancellation-policy')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.getCancellationPolicy();
  }
}

@Controller('admin/cancellation-policy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Patch()
  update(
    @Body(new ZodValidationPipe(cancellationPolicyInputSchema))
    dto: CancellationPolicyInput,
  ) {
    return this.settings.updateCancellationPolicy(dto);
  }
}
