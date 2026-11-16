import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  donationOfferInputSchema,
  type DonationOfferInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DonationsService } from './donations.service';

// Any signed-in user may offer a donation — no seller registration or
// membership: giving an item away isn't selling it.
@Controller('donations')
@UseGuards(JwtAuthGuard)
export class DonationsController {
  constructor(private readonly donations: DonationsService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(donationOfferInputSchema))
    dto: DonationOfferInput,
  ) {
    return this.donations.create(user.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: RequestUser) {
    return this.donations.listMine(user.id);
  }
}
