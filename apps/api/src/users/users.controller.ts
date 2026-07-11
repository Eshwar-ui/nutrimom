import { Body, Controller, Get, NotFoundException, Patch, Post, UseGuards } from '@nestjs/common';
import { profileUpdateSchema, type ProfileUpdateInput } from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const found = await this.users.findById(user.id);
    if (!found) throw new NotFoundException('User not found');
    return this.users.toAuthUser(found);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(profileUpdateSchema)) dto: ProfileUpdateInput,
  ) {
    const updated = await this.users.updateProfile(user.id, dto);
    return this.users.toAuthUser(updated);
  }

  @Post('me/request-seller-verification')
  requestSellerVerification(@CurrentUser() user: RequestUser) {
    return this.users.requestSellerVerification(user.id);
  }
}
