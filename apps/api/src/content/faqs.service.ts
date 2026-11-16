import { Injectable, NotFoundException } from '@nestjs/common';
import type { Faq as FaqRow } from '@prisma/client';
import type { Faq, FaqInput, FaqSection } from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import { isRecordNotFound } from './content-utils';

// Section enum order is the page order (General first), then the admin's own.
const ORDER = [
  { section: 'asc' as const },
  { sortOrder: 'asc' as const },
  { createdAt: 'asc' as const },
];

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public ----

  async publicList(section?: FaqSection): Promise<Faq[]> {
    const rows = await this.prisma.faq.findMany({
      where: section ? { isPublished: true, section } : { isPublished: true },
      orderBy: ORDER,
    });
    return rows.map(toDto);
  }

  // ---- Admin ----

  async adminList(): Promise<Faq[]> {
    const rows = await this.prisma.faq.findMany({ orderBy: ORDER });
    return rows.map(toDto);
  }

  async create(input: FaqInput): Promise<Faq> {
    const row = await this.prisma.faq.create({ data: toData(input) });
    return toDto(row);
  }

  async update(id: string, input: FaqInput): Promise<Faq> {
    const row = await this.prisma.faq
      .update({ where: { id }, data: toData(input) })
      .catch((err: unknown) => {
        if (isRecordNotFound(err)) throw new NotFoundException('FAQ not found');
        throw err;
      });
    return toDto(row);
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.prisma.faq.delete({ where: { id } }).catch((err: unknown) => {
      if (isRecordNotFound(err)) throw new NotFoundException('FAQ not found');
      throw err;
    });
    return { id };
  }
}

function toData(input: FaqInput) {
  return {
    section: input.section,
    question: input.question,
    answer: input.answer,
    sortOrder: input.sortOrder,
    isPublished: input.isPublished,
  };
}

function toDto(row: FaqRow): Faq {
  return {
    id: row.id,
    section: row.section,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
