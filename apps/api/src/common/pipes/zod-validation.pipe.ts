import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Validates a request payload against a Zod schema (from @nutrimom/shared),
 * returning the parsed + typed value. Apply per-route:
 *   @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderInput
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten(),
      });
    }
    return result.data;
  }
}
