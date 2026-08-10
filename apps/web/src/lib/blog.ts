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

/**
 * A meta description for a post that has no excerpt — the excerpt field is
 * optional in the admin form, and falling back to the site-wide description
 * gives every such post the same snippet in search results.
 *
 * Strips markdown to plain prose rather than parsing it: this only ever feeds
 * a `<meta>` tag, so the cost of a full parse buys nothing.
 */
export function markdownExcerpt(markdown: string, title: string): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/^\s{0,3}>+\s?/gm, "") // blockquote markers
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "") // list markers
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/[*_~`]/g, "") // emphasis / inline code
    .replace(/\s+/g, " ")
    .trim();

  // The body usually opens by repeating the title as an H1; the page already
  // drops it when rendering, and it would waste the whole snippet here.
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const withoutTitle = normalise(plain).startsWith(normalise(title))
    ? plain.slice(title.length).replace(/^[\s.:—-]+/, "")
    : plain;

  return withoutTitle;
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
