import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  Role,
  businessProfileInputSchema,
  cancellationPolicyInputSchema,
  payoutPolicyInputSchema,
  type BusinessProfileInput,
  type CancellationPolicyInput,
  type PayoutPolicyInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SettingsService } from './settings.service';

// Public and unauthenticated. Two callers need it: the buyer cancel dialog
// (signed in) and the published refund policy page (signed out, server
// rendered) — and a cancellation policy that can't be read before you buy
// isn't much of a policy. Nothing here is sensitive: cutoff, reason codes and
// refund % are exactly what the page is legally required to state.
@Controller('cancellation-policy')
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

// Public and unauthenticated — the legal pages are server-rendered for
// signed-out visitors and search engines.
@Controller('business-profile')
export class BusinessProfileController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.getBusinessProfile();
  }
}

@Controller('admin/business-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminBusinessProfileController {
  constructor(private readonly settings: SettingsService) {}

  @Patch()
  update(
    @Body(new ZodValidationPipe(businessProfileInputSchema))
    dto: BusinessProfileInput,
  ) {
    return this.settings.updateBusinessProfile(dto);
  }
}

// Public and unauthenticated, read-only. The commission is published policy:
// /preloved and /faq tell sellers what share of a sale they keep, and they
// quote it from this row so an admin edit can't leave the page promising a
// rate the payout ledger no longer snapshots. Only `commissionBps` is exposed —
// mirrors the public `GET /cancellation-policy` above.
@Controller('payout-policy')
export class PayoutPolicyController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.getPublicPayoutPolicy();
  }
}

// Admin-only writes: the rate is readable by anyone (above) but only an admin
// can change it.
@Controller('admin/payout-policy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPayoutPolicyController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.getPayoutPolicy();
  }

  @Patch()
  update(
    @Body(new ZodValidationPipe(payoutPolicyInputSchema))
    dto: PayoutPolicyInput,
  ) {
    return this.settings.updatePayoutPolicy(dto);
  }
}
