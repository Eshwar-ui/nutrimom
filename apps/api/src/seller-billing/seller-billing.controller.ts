import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  membershipCheckoutSchema,
  verifySellerPaymentSchema,
  type MembershipCheckoutInput,
  type VerifySellerPaymentInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SellerBillingService } from './seller-billing.service';

@Controller('seller/billing')
@UseGuards(JwtAuthGuard)
export class SellerBillingController {
  constructor(private readonly billing: SellerBillingService) {}

  @Get('status')
  status(@CurrentUser() user: RequestUser) {
    return this.billing.status(user.id);
  }

  @Post('registration')
  registration(@CurrentUser() user: RequestUser) {
    return this.billing.registrationCheckout(user.id);
  }

  @Post('membership')
  membership(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(membershipCheckoutSchema))
    dto: MembershipCheckoutInput,
  ) {
    return this.billing.membershipCheckout(user.id, dto.plan);
  }

  @Post('verify')
  @HttpCode(200)
  verify(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(verifySellerPaymentSchema))
    dto: VerifySellerPaymentInput,
  ) {
    return this.billing.verify(user.id, dto);
  }
}
