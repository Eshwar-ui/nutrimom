import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { verifyPaymentSchema, type VerifyPaymentInput } from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PaymentsService } from './payments.service';

const createOrderBodySchema = z.object({ orderId: z.string().min(1) });
type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('razorpay/order')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createOrderBodySchema)) dto: CreateOrderBody,
  ) {
    return this.payments.createRazorpayOrder(user.id, dto.orderId);
  }

  @Post('razorpay/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  verify(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(verifyPaymentSchema)) dto: VerifyPaymentInput,
  ) {
    return this.payments.verify(user.id, dto);
  }

  // Public — authenticity is proven by the HMAC signature, not a JWT.
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.payments.handleWebhook(req.rawBody!, signature);
  }
}
