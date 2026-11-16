import { Module } from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';
import { PartnerOffersService } from './partner-offers.service';
import { FaqsService } from './faqs.service';
import { TestimonialsService } from './testimonials.service';
import { SiteContentService } from './site-content.service';
import {
  FaqsController,
  PartnerOffersController,
  ServicePackagesController,
  SiteContentController,
  TestimonialsController,
} from './content.controller';
import {
  AdminFaqsController,
  AdminPartnerOffersController,
  AdminServicePackagesController,
  AdminSiteContentController,
  AdminTestimonialsController,
} from './admin-content.controller';

/**
 * The admin-editable content behind the redesigned public pages
 * (REDESIGN-PLAN.md phase 1c): service packages and prices, partner offers,
 * FAQs, testimonials and the SiteContent singleton. Layout stays in code;
 * only these structured fields are editable.
 */
@Module({
  providers: [
    ServicePackagesService,
    PartnerOffersService,
    FaqsService,
    TestimonialsService,
    SiteContentService,
  ],
  controllers: [
    ServicePackagesController,
    PartnerOffersController,
    FaqsController,
    TestimonialsController,
    SiteContentController,
    AdminServicePackagesController,
    AdminPartnerOffersController,
    AdminFaqsController,
    AdminTestimonialsController,
    AdminSiteContentController,
  ],
})
export class ContentModule {}
