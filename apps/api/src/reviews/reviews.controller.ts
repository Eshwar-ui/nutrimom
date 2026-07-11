import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { createReviewSchema, type CreateReviewInput } from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ReviewsService } from './reviews.service';

@Controller('orders/:orderId/reviews')
@UseGuards(JwtAuthGuard)
export class OrderReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewInput,
  ) {
    return this.reviews.create(user.id, orderId, dto);
  }
}

@Controller('sellers/:id/reviews')
export class SellerReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Param('id') sellerId: string) {
    return this.reviews.listForSeller(sellerId);
  }
}
