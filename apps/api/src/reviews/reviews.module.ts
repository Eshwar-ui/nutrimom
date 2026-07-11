import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  OrderReviewsController,
  SellerReviewsController,
} from './reviews.controller';

@Module({
  providers: [ReviewsService],
  controllers: [OrderReviewsController, SellerReviewsController],
  exports: [ReviewsService],
})
export class ReviewsModule {}
