import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlogPost as BlogPostRow } from '@prisma/client';
import type {
  BlogPost,
  BlogPostInput,
  BlogQuery,
  Paginated,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public ----

  async browsePublished(query: BlogQuery): Promise<Paginated<BlogPost>> {
    const where = { published: true };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return {
      items: rows.map(toDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  /**
   * Resolves a post by its current slug, falling back to slugs it used to live
   * at so old links keep working. The returned DTO always carries the *current*
   * slug — the caller compares it to what was requested and redirects when they
   * differ, which is what keeps the canonical URL in the address bar.
   */
  async getPublishedBySlug(slug: string): Promise<BlogPost> {
    const row =
      (await this.prisma.blogPost.findUnique({ where: { slug } })) ??
      (await this.prisma.blogPostSlug
        .findUnique({ where: { slug }, include: { post: true } })
        .then((history) => history?.post ?? null));
    if (!row || !row.published) throw new NotFoundException('Post not found');
    return toDto(row);
  }

  // ---- Admin ----

  async adminList(): Promise<BlogPost[]> {
    const rows = await this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  }

  async adminGet(id: string): Promise<BlogPost> {
    const row = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Post not found');
    return toDto(row);
  }

  async create(input: BlogPostInput): Promise<BlogPost> {
    const row = await this.prisma
      .$transaction(async (tx) => {
        // A live slug outranks a retired one: if some older post used to sit
        // here, drop that redirect rather than let it shadow the new post.
        await tx.blogPostSlug.deleteMany({ where: { slug: input.slug } });
        return tx.blogPost.create({ data: toCreateData(input) });
      })
      .catch((err: unknown) => {
        if (isUniqueViolation(err))
          throw new BadRequestException('That slug is already in use');
        throw err;
      });
    return toDto(row);
  }

  async update(id: string, input: BlogPostInput): Promise<BlogPost> {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');

    const row = await this.prisma
      .$transaction(async (tx) => {
        if (existing.slug !== input.slug) {
          await tx.blogPostSlug.deleteMany({ where: { slug: input.slug } });
          // Keep the old address pointing here. upsert, not create: the post
          // may have used this slug before and been renamed back.
          await tx.blogPostSlug.upsert({
            where: { slug: existing.slug },
            create: { slug: existing.slug, postId: id },
            update: { postId: id },
          });
        }
        return tx.blogPost.update({ where: { id }, data: toCreateData(input) });
      })
      .catch((err: unknown) => {
        if (isRecordNotFound(err))
          throw new NotFoundException('Post not found');
        if (isUniqueViolation(err))
          throw new BadRequestException('That slug is already in use');
        throw err;
      });
    return toDto(row);
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.prisma.blogPost.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Post not found');
    });
    return { id };
  }

  async setPublished(id: string, published: boolean): Promise<BlogPost> {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    const row = await this.prisma.blogPost.update({
      where: { id },
      data: {
        published,
        // First publish sets it; later unpublish/republish cycles keep the
        // original date rather than bumping it, matching how a "posted on"
        // date reads to a visitor.
        publishedAt: published
          ? (existing.publishedAt ?? new Date())
          : existing.publishedAt,
      },
    });
    return toDto(row);
  }
}

function toCreateData(input: BlogPostInput) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt || null,
    bodyMarkdown: input.bodyMarkdown,
    coverImageUrl: input.coverImageUrl || null,
    authorName: input.authorName,
  };
}

function prismaCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'code' in err
    ? (err as { code?: string }).code
    : undefined;
}

function isRecordNotFound(err: unknown): boolean {
  return prismaCode(err) === 'P2025';
}

/**
 * Only a real unique-constraint break is reported as a slug clash. Reporting
 * every failure that way (as this used to) hands the admin a wrong explanation
 * for an unrelated database error and hides the actual fault.
 */
function isUniqueViolation(err: unknown): boolean {
  return prismaCode(err) === 'P2002';
}

function toDto(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    bodyMarkdown: row.bodyMarkdown,
    coverImageUrl: row.coverImageUrl,
    published: row.published,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
