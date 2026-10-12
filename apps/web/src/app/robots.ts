import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Paths crawlers must never spend budget on: signed-in areas, the transactional
 * funnel, the credential flows, and the internal brand-preview page. Each of
 * these also carries `robots: noindex` in its own metadata — this stops the
 * fetch, that stops the indexing if something links straight in.
 */
const PRIVATE_PATHS = [
  "/account",
  "/admin",
  "/cart",
  "/checkout",
  "/orders",
  "/wishlist",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/brand",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // Names the one host these URLs should be indexed under, so the apex and
    // any *.vercel.app preview don't compete with www for the same pages.
    host: SITE_URL,
  };
}
