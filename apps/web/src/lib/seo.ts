import type { Metadata } from "next";

/**
 * One definition of the site's identity, shared by every page's metadata,
 * `robots.ts`, `sitemap.ts` and the JSON-LD builders. These used to be
 * re-declared per file, which is exactly how a canonical host drifts from the
 * host in the sitemap.
 */
/**
 * The canonical production origin — `www`, https, no trailing slash. Every
 * canonical, OG url and sitemap entry has to agree on this exact spelling, or
 * the same page gets indexed twice under two hosts.
 *
 * It is the built-in fallback rather than env-only because `NEXT_PUBLIC_SITE_URL`
 * was never set on Vercel: the live site was publishing a sitemap and canonical
 * tags full of `http://localhost:4000`. Set the env var to override (a staging
 * domain, say); leave it unset and production is still correct.
 */
export const PRODUCTION_URL = "https://www.thenurturemoms.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:4000")
).replace(/\/+$/, "");

export const SITE_NAME = "The Nurture Moms";
export const SITE_TAGLINE = "Preloved baby & maternity marketplace";

export const SITE_DESCRIPTION =
  "Buy and sell gently used baby, kids and maternity essentials — strollers, clothes, toys, car seats and more — from verified moms across India.";

/** Absolute URL for a site-relative path (crawlers and social cards need one). */
export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The default social card. A single committed 1200×630 PNG rather than a
 * generated one: every crawler that matters caches it, and a static file can't
 * fail to render at request time.
 */
export const OG_IMAGE = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
} as const;

type OgImage = string | { url: string; alt?: string; width?: number; height?: number };

export interface PageSeo {
  /** Page title, run through the root layout's `%s · The Nurture Moms` template. */
  title?: string;
  /**
   * Title used verbatim, escaping the template — for the home page, where
   * "… · The Nurture Moms" would repeat the brand twice.
   */
  absoluteTitle?: string;
  description?: string;
  /** Canonical path, e.g. `/listings`. Relative — resolved against `metadataBase`. */
  path: string;
  images?: OgImage[];
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  /** Keep the page out of the index (private, transactional or duplicate). */
  noIndex?: boolean;
}

/**
 * Builds a complete metadata block for a public page: canonical, Open Graph and
 * Twitter card.
 *
 * Every page goes through here because Next **replaces** the whole `openGraph`
 * object when a child sets it (it does not deep-merge), so a page that declares
 * `openGraph: { title }` silently drops the site name, locale and image
 * inherited from the root layout. Building the full object once removes that
 * trap.
 */
export function pageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  images = [OG_IMAGE],
  type = "website",
  publishedTime,
  authors,
  noIndex,
}: PageSeo): Metadata {
  const ogTitle =
    absoluteTitle ??
    (title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`);
  const desc = description ?? SITE_DESCRIPTION;
  const hasLargeImage = images.length > 0;

  return {
    ...(absoluteTitle ? { title: { absolute: absoluteTitle } } : title ? { title } : {}),
    description: desc,
    alternates: { canonical: path },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_IN",
      title: ogTitle,
      description: desc,
      url: path,
      images,
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: hasLargeImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: desc,
      images,
    },
  };
}

/**
 * Squeezes free text (a listing description, a blog excerpt) into a meta
 * description: whitespace collapsed and cut at a word boundary, since a
 * mid-word truncation is what Google shows verbatim.
 */
export function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Metadata for a signed-in-only or transactional page. These are already
 * blocked in robots.txt; the meta tag is the belt to that braces, and covers
 * anything that reaches the page through a link rather than a crawl.
 */
export function privateMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: false },
  };
}
