import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ShippingService } from './shipping.service';

// Seller fulfilment: list sales, generate a shipping label, mark shipped.
@Controller('seller/sales')
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.shipping.listSales(user.id);
  }

  @Post(':orderId/label')
  label(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.shipping.generateLabel(user.id, orderId);
  }

  @Post(':orderId/ship')
  ship(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    return this.shipping.markShipped(user.id, orderId);
  }
}
