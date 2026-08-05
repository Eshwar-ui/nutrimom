import type { MetadataRoute } from "next";
import { isBusinessProfileComplete } from "@nutrimom/shared";
import { getCategories, getListings } from "@/lib/listings";
import { getBlogPostsForSitemap } from "@/lib/blog";
import { getBusinessProfile } from "@/lib/business-profile";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000";

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

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/listings`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/sell`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    // Not gated: a plain-English guidelines hub, not a statutory document, so
    // it publishes regardless of the operator's business details.
    { url: `${SITE_URL}/policies`, changeFrequency: "yearly", priority: 0.3 },
  ];

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

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...legalRoutes,
    ...categoryRoutes,
    ...blogRoutes,
    ...listingRoutes,
  ];
}
