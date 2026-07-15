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
import { SellerBillingService } from '../seller-billing/seller-billing.service';

const createOrderBodySchema = z.object({ orderId: z.string().min(1) });
type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly sellerBilling: SellerBillingService,
  ) {}

  @Post('order')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createOrderBodySchema)) dto: CreateOrderBody,
  ) {
    return this.payments.createGatewayOrder(user.id, dto.orderId);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  verify(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(verifyPaymentSchema)) dto: VerifyPaymentInput,
  ) {
    return this.payments.verify(user.id, dto);
  }

  // Public — authenticity is proven by the HMAC signature, not a JWT. One
  // gateway webhook URL settles whichever domain the event belongs to: an
  // order payment or a seller registration/membership payment (each no-ops if
  // the gateway order id isn't theirs).
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    await this.payments.handleWebhook(req.rawBody!, signature);
    await this.sellerBilling.handleWebhook(req.rawBody!, signature);
    return { received: true };
  }
}
