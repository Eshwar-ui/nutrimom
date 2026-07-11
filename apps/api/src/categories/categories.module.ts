import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  CategoriesController,
  AdminCategoriesController,
} from './categories.controller';

@Module({
  providers: [CategoriesService],
  controllers: [CategoriesController, AdminCategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
