import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Category, CategoryInput } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }

  async create(input: CategoryInput): Promise<Category> {
    try {
      return await this.prisma.category.create({ data: input });
    } catch (err) {
      if (isUniqueSlugError(err)) {
        throw new BadRequestException('A category with that slug already exists');
      }
      throw err;
    }
  }

  async update(id: string, input: CategoryInput): Promise<Category> {
    try {
      return await this.prisma.category.update({ where: { id }, data: input });
    } catch (err) {
      if (isUniqueSlugError(err)) {
        throw new BadRequestException('A category with that slug already exists');
      }
      throw new NotFoundException('Category not found');
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    const listingCount = await this.prisma.listing.count({ where: { categoryId: id } });
    if (listingCount > 0) {
      throw new BadRequestException(
        `${listingCount} listing(s) still use this category — move or remove them first`,
      );
    }
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Category not found');
    }
    return { id };
  }
}

function isUniqueSlugError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}
