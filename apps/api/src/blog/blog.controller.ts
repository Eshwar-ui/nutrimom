import { Controller, Get, Param, Query } from '@nestjs/common';
import { blogQuerySchema, type BlogQuery } from '@nutrimom/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  browse(@Query(new ZodValidationPipe(blogQuerySchema)) query: BlogQuery) {
    return this.blog.browsePublished(query);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.blog.getPublishedBySlug(slug);
  }
}
