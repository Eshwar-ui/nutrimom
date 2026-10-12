import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  contactMessageInputSchema,
  type ContactMessageInput,
} from '@nutrimom/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  submit(
    @Body(new ZodValidationPipe(contactMessageInputSchema))
    dto: ContactMessageInput,
  ) {
    return this.contact.submit(dto);
  }
}
