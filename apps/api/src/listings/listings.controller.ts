import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { listingQuerySchema, type ListingQuery } from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
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

  @Post(':id/reserve')
  @UseGuards(JwtAuthGuard)
  reserve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.listings.reserve(user.id, id);
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
