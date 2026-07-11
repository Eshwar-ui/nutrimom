import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  listingInputSchema,
  listingUpdateSchema,
  type ListingInput,
  type ListingUpdateInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ListingsService } from './listings.service';

@Controller('seller/listings')
@UseGuards(JwtAuthGuard)
export class SellerListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  mine(@CurrentUser() user: RequestUser) {
    return this.listings.listMine(user.id);
  }

  @Get('stats')
  stats(@CurrentUser() user: RequestUser) {
    return this.listings.sellerStats(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(listingInputSchema)) dto: ListingInput,
  ) {
    return this.listings.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(listingUpdateSchema)) dto: ListingUpdateInput,
  ) {
    return this.listings.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.listings.remove(user.id, id);
  }
}
