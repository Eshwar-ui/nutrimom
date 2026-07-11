import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  Role,
  verifySellerSchema,
  type VerifySellerInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.adminList();
  }

  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(verifySellerSchema)) dto: VerifySellerInput,
  ) {
    return this.users.verifySeller(id, dto.isSellerVerified);
  }
}
