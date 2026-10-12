import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  Role,
  blogPostInputSchema,
  setBlogPostPublishedSchema,
  type BlogPostInput,
  type SetBlogPostPublishedInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BlogService } from './blog.service';

@Controller('admin/blog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminBlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  list() {
    return this.blog.adminList();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.blog.adminGet(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(blogPostInputSchema)) dto: BlogPostInput) {
    return this.blog.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(blogPostInputSchema)) dto: BlogPostInput,
  ) {
    return this.blog.update(id, dto);
  }

  @Patch(':id/publish')
  setPublished(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setBlogPostPublishedSchema))
    dto: SetBlogPostPublishedInput,
  ) {
    return this.blog.setPublished(id, dto.published);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blog.remove(id);
  }
}
