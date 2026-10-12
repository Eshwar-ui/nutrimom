import type { MetadataRoute } from "next";
import { BLOG_CATEGORIES, isBusinessProfileComplete } from "@nutrimom/shared";
import { getCategories, getListings } from "@/lib/listings";
import { getBlogPostsForSitemap } from "@/lib/blog";
import { getBusinessProfile } from "@/lib/business-profile";
import { SITE_URL } from "@/lib/seo";
import { STATIC_SITEMAP_ROUTES } from "@/lib/site-nav";

// The listings API caps pageSize at 60 (packages/shared listingQuerySchema),
// so covering the newest ~500 approved listings means paginating rather than
// requesting one oversized page — that used to 400 and get silently
// swallowed by the .catch(), producing a sitemap with zero listing URLs.
const SITEMAP_PAGE_SIZE = 60;
const SITEMAP_MAX_PAGES = 9;

async function getListingsForSitemap() {
  const items: Awaited<ReturnType<typeof getListings>>["items"] = [];
  for (let page = 1; page <= SITEMAP_MAX_PAGES; page++) {
    const result = await getListings({
      page,
      pageSize: SITEMAP_PAGE_SIZE,
      sort: "newest",
    }).catch(() => null);
    if (!result || result.items.length === 0) break;
    items.push(...result.items);
    if (page >= result.totalPages) break;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, listingItems, blogPosts, businessProfile] =
    await Promise.all([
      getCategories().catch(() => []),
      getListingsForSitemap(),
      getBlogPostsForSitemap(),
      getBusinessProfile(),
    ]);

  // Sourced from lib/site-nav so the sitemap and the navigation cannot drift:
  // a pillar added to the menu is submitted, and one pulled from the menu stops
  // being advertised, without anyone remembering to edit two files.
  const staticRoutes: MetadataRoute.Sitemap = STATIC_SITEMAP_ROUTES.map(
    (route) => ({
      url: route.path === "/" ? SITE_URL : `${SITE_URL}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }),
  );

  // The three statutory pages carry `noindex` until the BusinessProfile names
  // a real entity, address and grievance officer (see lib/business-profile).
  // Listing them while they say exactly that is telling crawlers to fetch a
  // page and then ignore it — so they enter the sitemap on the same condition.
  const legalRoutes: MetadataRoute.Sitemap = isBusinessProfileComplete(
    businessProfile,
  )
    ? ["/terms", "/privacy", "/refunds"].map((path) => ({
        url: `${SITE_URL}${path}`,
        changeFrequency: "yearly" as const,
        priority: 0.2,
      }))
    : [];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const listingRoutes: MetadataRoute.Sitemap = listingItems.map((l) => ({
    url: `${SITE_URL}/listings/${l.id}`,
    lastModified: l.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // The ten journal categories are fixed topic pages, not filter permutations,
  // so they are submitted like any other landing page.
  const journalCategoryRoutes: MetadataRoute.Sitemap = BLOG_CATEGORIES.map(
    (category) => ({
      url: `${SITE_URL}/journal?category=${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
  );

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/journal/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...legalRoutes,
    ...categoryRoutes,
    ...journalCategoryRoutes,
    ...blogRoutes,
    ...listingRoutes,
  ];
}
