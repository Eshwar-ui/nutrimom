import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  PayoutStatus,
  Role,
  markPayoutPaidSchema,
  type MarkPayoutPaidInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PayoutsService } from './payouts.service';

// A seller sees only their own ledger — what's on hold, owed, and paid.
@Controller('seller/payouts')
@UseGuards(JwtAuthGuard)
export class SellerPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.payouts.listForSeller(user.id);
  }

  @Get('summary')
  summary(@CurrentUser() user: RequestUser) {
    return this.payouts.summaryForSeller(user.id);
  }
}

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  list(@Query('status') status?: string) {
    if (status !== undefined && !(status in PayoutStatus)) {
      throw new BadRequestException('Unknown payout status');
    }
    return this.payouts.listForAdmin(status as PayoutStatus | undefined);
  }

  @Post(':id/pay')
  pay(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(markPayoutPaidSchema)) dto: MarkPayoutPaidInput,
  ) {
    return this.payouts.markPaid(id, dto);
  }
}
