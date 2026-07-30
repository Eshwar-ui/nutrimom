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
