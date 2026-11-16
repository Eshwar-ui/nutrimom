import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  Role,
  faqInputSchema,
  partnerOfferInputSchema,
  servicePackageInputSchema,
  siteContentInputSchema,
  testimonialInputSchema,
  type FaqInput,
  type PartnerOfferInput,
  type ServicePackageInput,
  type SiteContentInput,
  type TestimonialInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ServicePackagesService } from './service-packages.service';
import { PartnerOffersService } from './partner-offers.service';
import { FaqsService } from './faqs.service';
import { TestimonialsService } from './testimonials.service';
import { SiteContentService } from './site-content.service';

// Every write here is a full replace (PUT): the admin forms always send the
// whole record, and a cleared optional field arrives as "" or null, which the
// services store as null.

@Controller('admin/services/packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminServicePackagesController {
  constructor(private readonly packages: ServicePackagesService) {}

  @Get()
  list() {
    return this.packages.adminList();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(servicePackageInputSchema))
    dto: ServicePackageInput,
  ) {
    return this.packages.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(servicePackageInputSchema))
    dto: ServicePackageInput,
  ) {
    return this.packages.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packages.remove(id);
  }
}

@Controller('admin/offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPartnerOffersController {
  constructor(private readonly offers: PartnerOffersService) {}

  @Get()
  list() {
    return this.offers.adminList();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(partnerOfferInputSchema))
    dto: PartnerOfferInput,
  ) {
    return this.offers.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(partnerOfferInputSchema))
    dto: PartnerOfferInput,
  ) {
    return this.offers.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offers.remove(id);
  }
}

@Controller('admin/faqs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  list() {
    return this.faqs.adminList();
  }

  @Post()
  create(@Body(new ZodValidationPipe(faqInputSchema)) dto: FaqInput) {
    return this.faqs.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(faqInputSchema)) dto: FaqInput,
  ) {
    return this.faqs.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.faqs.remove(id);
  }
}

@Controller('admin/testimonials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  list() {
    return this.testimonials.adminList();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(testimonialInputSchema))
    dto: TestimonialInput,
  ) {
    return this.testimonials.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(testimonialInputSchema))
    dto: TestimonialInput,
  ) {
    return this.testimonials.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testimonials.remove(id);
  }
}

@Controller('admin/site-content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSiteContentController {
  constructor(private readonly siteContent: SiteContentService) {}

  @Put()
  update(
    @Body(new ZodValidationPipe(siteContentInputSchema))
    dto: SiteContentInput,
  ) {
    return this.siteContent.update(dto);
  }
}
