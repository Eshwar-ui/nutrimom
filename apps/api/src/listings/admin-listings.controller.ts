import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  Role,
  moderateListingSchema,
  featureListingSchema,
  type ModerateListingInput,
  type FeatureListingInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ListingsService } from './listings.service';

@Controller('admin/listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.listings.adminList(status);
  }

  @Patch(':id/moderate')
  moderate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderateListingSchema))
    dto: ModerateListingInput,
  ) {
    return this.listings.moderate(id, dto);
  }

  @Patch(':id/feature')
  feature(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(featureListingSchema)) dto: FeatureListingInput,
  ) {
    return this.listings.setFeatured(id, dto.isFeatured);
  }
}
