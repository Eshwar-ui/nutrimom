import { request } from "./api";
import type { BlogPost, Paginated } from "@nutrimom/shared";

// Server-side reads (public endpoints, cached + revalidated) — mirrors lib/listings.ts.

export function getBlogPosts(page = 1): Promise<Paginated<BlogPost>> {
  return request<Paginated<BlogPost>>(`/blog?page=${page}`, { revalidate: 60 });
}

export function getBlogPost(slug: string): Promise<BlogPost> {
  return request<BlogPost>(`/blog/${encodeURIComponent(slug)}`, {
    revalidate: 60,
  });
}

// The blog API caps pageSize at 60 (packages/shared blogQuerySchema), so
// covering every published post means paginating rather than asking for one
// oversized page — which would 400 and leave the sitemap with no post URLs at
// all. Same trap listings hit; see the note in app/sitemap.ts.
const SITEMAP_PAGE_SIZE = 60;
const SITEMAP_MAX_PAGES = 20;

/** Every published post, for the sitemap. Yields [] rather than throwing. */
export async function getBlogPostsForSitemap(): Promise<BlogPost[]> {
  const items: BlogPost[] = [];
  for (let page = 1; page <= SITEMAP_MAX_PAGES; page++) {
    const result = await request<Paginated<BlogPost>>(
      `/blog?page=${page}&pageSize=${SITEMAP_PAGE_SIZE}`,
      { revalidate: 60 },
    ).catch(() => null);
    if (!result || result.items.length === 0) break;
    items.push(...result.items);
    if (page >= result.totalPages) break;
  }
  return items;
}
