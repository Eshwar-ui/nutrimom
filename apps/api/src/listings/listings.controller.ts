import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { listingQuerySchema, type ListingQuery } from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  browse(
    @Query(new ZodValidationPipe(listingQuerySchema)) query: ListingQuery,
  ) {
    return this.listings.browse(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.listings.getPublic(id);
  }

  // Authenticated (not just rate-limited) — the seller's phone number is PII
  // that shouldn't be scrapeable by iterating listing ids anonymously.
  @Get(':id/contact')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  contact(@Param('id') id: string) {
    return this.listings.getContact(id);
  }
}

@Controller('sellers')
export class SellersController {
  constructor(private readonly listings: ListingsService) {}

  @Get(':id')
  profile(@Param('id') id: string) {
    return this.listings.sellerProfile(id);
  }
}
