import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { AdminBlogController } from './admin-blog.controller';

@Module({
  providers: [BlogService],
  controllers: [BlogController, AdminBlogController],
})
export class BlogModule {}
