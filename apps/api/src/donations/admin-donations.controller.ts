import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import {
  DonationStatus,
  Role,
  donationStatusUpdateSchema,
  type DonationStatusUpdateInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DonationsService } from './donations.service';

// `?status=` and `?donor=` are both optional; an empty value is no filter.
const adminDonationQuerySchema = z.object({
  status: z
    .nativeEnum(DonationStatus)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  donor: z.string().trim().max(64).optional(),
});
type AdminDonationQuery = z.infer<typeof adminDonationQuerySchema>;

@Controller('admin/donations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDonationsController {
  constructor(private readonly donations: DonationsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminDonationQuerySchema))
    query: AdminDonationQuery,
  ) {
    return this.donations.adminList({
      status: query.status,
      donorId: query.donor || undefined,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.donations.adminGet(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(donationStatusUpdateSchema))
    dto: DonationStatusUpdateInput,
  ) {
    return this.donations.adminUpdate(id, dto);
  }
}
