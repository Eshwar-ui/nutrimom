import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { FaqSection, ServiceGroup } from '@nutrimom/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ServicePackagesService } from './service-packages.service';
import { PartnerOffersService } from './partner-offers.service';
import { FaqsService } from './faqs.service';
import { TestimonialsService } from './testimonials.service';
import { SiteContentService } from './site-content.service';

// Public and unauthenticated: every page these feed is server-rendered for
// signed-out visitors and search engines. Each read returns only what is
// meant to be live (active, unexpired, published, consented) — the admin
// controllers are where drafts are visible.

const packagesQuerySchema = z.object({
  group: z
    .enum(Object.values(ServiceGroup) as [ServiceGroup, ...ServiceGroup[]], {
      errorMap: () => ({ message: 'Unknown service group' }),
    })
    .optional(),
});

const faqsQuerySchema = z.object({
  section: z
    .enum(Object.values(FaqSection) as [FaqSection, ...FaqSection[]], {
      errorMap: () => ({ message: 'Unknown FAQ section' }),
    })
    .optional(),
});

@Controller('services/packages')
export class ServicePackagesController {
  constructor(private readonly packages: ServicePackagesService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(packagesQuerySchema))
    query: z.infer<typeof packagesQuerySchema>,
  ) {
    return this.packages.publicList(query.group);
  }
}

@Controller('offers')
export class PartnerOffersController {
  constructor(private readonly offers: PartnerOffersService) {}

  @Get()
  list() {
    return this.offers.publicList();
  }
}

@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(faqsQuerySchema))
    query: z.infer<typeof faqsQuerySchema>,
  ) {
    return this.faqs.publicList(query.section);
  }
}

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  list() {
    return this.testimonials.publicList();
  }
}

@Controller('site-content')
export class SiteContentController {
  constructor(private readonly siteContent: SiteContentService) {}

  @Get()
  get() {
    return this.siteContent.get();
  }
}
