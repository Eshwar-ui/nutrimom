import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  Role,
  setContactMessageStatusSchema,
  type SetContactMessageStatusInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ContactService } from './contact.service';

@Controller('admin/contact-messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminContactController {
  constructor(private readonly contact: ContactService) {}

  @Get()
  list() {
    return this.contact.adminList();
  }

  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setContactMessageStatusSchema))
    dto: SetContactMessageStatusInput,
  ) {
    return this.contact.setStatus(id, dto.status);
  }
}
