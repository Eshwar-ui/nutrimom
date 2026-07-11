import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  wishlistToggleSchema,
  type WishlistToggleInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.wishlist.list(user.id);
  }

  @Get('ids')
  ids(@CurrentUser() user: RequestUser) {
    return this.wishlist.ids(user.id);
  }

  @Post('toggle')
  toggle(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(wishlistToggleSchema)) dto: WishlistToggleInput,
  ) {
    return this.wishlist.toggle(user.id, dto.listingId);
  }
}
