import {
  Condition,
  ListingStatus,
  isBusinessProfileComplete,
  type BlogPost,
  type BusinessProfile,
  type Listing,
} from "@nutrimom/shared";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "./seo";
import { SOCIAL_LINKS } from "./site-nav";

/** A JSON-LD node. Loose on purpose — schema.org shapes vary per @type. */
export type JsonLdNode = Record<string, unknown>;

/**
 * The four things this business offers, as the home page's Organization node
 * advertises them. Kept here rather than derived from `site-nav.ts` because
 * that file's job is what a human clicks; this is what the entity claims to
 * do, and Preloved is deliberately absent — it is covered far better by the
 * Product nodes on the listings themselves than by a vague Service node.
 */
const PILLAR_SERVICES = [
  { name: "Prenatal & Postnatal Yoga", path: "/yoga" },
  { name: "Pregnancy & Baby Nutrition", path: "/nutrition" },
  { name: "Starting Solids Guidance", path: "/nutrition/starting-solids" },
  { name: "Mom Support Community", path: "/community" },
] as const;

/**
 * A `Service` node for one of the pillar pages.
 *
 * **No `offers` block, deliberately.** Every one of these pages prints its
 * fees under "Starting prices … we'll confirm before you book", and the
 * founders' brief flags them all as unconfirmed planning ranges. `Offer.price`
 * asserts a firm price, so emitting one would publish a machine-readable
 * commitment the page itself declines to make. Name the services, price them
 * when the prices are real.
 */
export function serviceJsonLd({
  name,
  description,
  path,
  serviceType,
  offerings,
}: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  /** The individual sessions the page lists, by title. */
  offerings: string[];
}): JsonLdNode {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    serviceType,
    url,
    provider: { "@id": `${absoluteUrl("/")}#organization` },
    areaServed: { "@type": "Country", name: "India" },
    // Sessions run online, so the audience is the whole country rather than a
    // catchment around a studio.
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: url,
      availableLanguage: ["en", "hi"],
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name,
      itemListElement: offerings.map((title) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: title },
      })),
    },
  };
}

/**
 * The business itself. Rendered on the home page so search engines can attach
 * the brand to a knowledge panel. Contact details come from the admin-filled
 * BusinessProfile and are omitted entirely until it's complete — a half-filled
 * Organization block is worse than none.
 *
 * Still an `OnlineStore`, because the marketplace is a real online shop and
 * dropping the type would cost that signal. But the site is a four-pillar
 * ecosystem now, so `hasOfferCatalog` names what else it offers — otherwise
 * the only machine-readable claim this brand makes is that it sells used
 * pushchairs, which is a quarter of what it does.
 */
export function organizationJsonLd(profile: BusinessProfile | null): JsonLdNode {
  const complete = isBusinessProfileComplete(profile);
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE_NAME,
    ...(complete && profile ? { legalName: profile.legalEntityName } : {}),
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.svg"),
    image: absoluteUrl("/og-default.png"),
    description: SITE_DESCRIPTION,
    areaServed: { "@type": "Country", name: "India" },
    sameAs: Object.values(SOCIAL_LINKS),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: PILLAR_SERVICES.map((svc) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          "@id": `${absoluteUrl(svc.path)}#service`,
          name: svc.name,
          url: absoluteUrl(svc.path),
        },
      })),
    },
    ...(complete && profile
      ? {
          email: profile.supportEmail,
          telephone: profile.supportPhone,
          address: {
            "@type": "PostalAddress",
            streetAddress: profile.registeredAddress,
            addressCountry: "IN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: profile.supportEmail,
            telephone: profile.supportPhone,
            areaServed: "IN",
            availableLanguage: ["en", "hi"],
          },
        }
      : {}),
  };
}

/**
 * The site, plus the sitelinks search box pointing at the real listings
 * search. `query-input` must name a parameter that actually exists — this one
 * maps to `/listings?search=`.
 */
export function websiteJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/listings")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Trail of `{ name, path }`, starting at Home. */
export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

// Everything here is secondhand except NEW ("new with tags"), so the three
// used grades all map to UsedCondition — schema.org has no finer used grades
// and inventing one would fail validation.
const schemaCondition: Record<Condition, string> = {
  [Condition.NEW]: "https://schema.org/NewCondition",
  [Condition.LIKE_NEW]: "https://schema.org/UsedCondition",
  [Condition.GOOD]: "https://schema.org/UsedCondition",
  [Condition.FAIR]: "https://schema.org/UsedCondition",
};

// RESERVED is a live 2-day hold for one buyer, so the item is genuinely not
// purchasable — advertising InStock for it earns a Merchant Center penalty
// when the crawler follows through and can't buy.
function schemaAvailability(status: Listing["status"]): string {
  if (status === ListingStatus.SOLD) return "https://schema.org/SoldOut";
  if (status === ListingStatus.RESERVED) return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

/**
 * Product + Offer for a listing. Every item is one-of-a-kind, hence
 * `inventoryLevel: 1` and no brand/GTIN — these are secondhand goods from
 * individuals, and fabricating identifiers to satisfy a rich-result warning
 * would be a lie about the item.
 */
export function listingJsonLd(listing: Listing): JsonLdNode {
  const url = absoluteUrl(`/listings/${listing.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: listing.title,
    description: listing.description,
    image: listing.images.map((src) => absoluteUrl(src)),
    category: listing.category.name,
    itemCondition: schemaCondition[listing.condition],
    inventoryLevel: { "@type": "QuantitativeValue", value: 1 },
    offers: {
      "@type": "Offer",
      url,
      // schema.org prices are decimal currency units, not the integer paise
      // the rest of the codebase stores.
      price: (listing.sellingPriceInPaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: schemaAvailability(listing.status),
      itemCondition: schemaCondition[listing.condition],
      areaServed: { "@type": "Country", name: "India" },
      seller: {
        "@type": "Person",
        name: listing.seller.name,
        url: absoluteUrl(`/sellers/${listing.seller.id}`),
      },
    },
  };
}

/** `description` is passed in so it matches the page's meta description
 *  exactly, including the derived-from-body fallback for posts with no
 *  excerpt. */
export function blogPostJsonLd(post: BlogPost, description?: string): JsonLdNode {
  const url = absoluteUrl(`/journal/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    headline: post.title,
    ...(description ? { description } : {}),
    ...(post.coverImageUrl ? { image: [absoluteUrl(post.coverImageUrl)] } : {}),
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    dateModified: post.updatedAt,
    inLanguage: "en-IN",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
