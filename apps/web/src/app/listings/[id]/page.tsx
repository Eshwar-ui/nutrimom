import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { conditionLabels, formatPaise, type Listing } from "@nutrimom/shared";
import { getListing, getListings } from "@/lib/listings";
import { ApiError } from "@/lib/api";
import { metaDescription, pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, listingJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ListingDetail } from "@/components/listing-detail";

/** Leads with the facts a shopper scans for in a result — condition, price,
 *  city — then as much of the seller's own copy as fits. */
function describe(listing: Listing): string {
  const lead = `${conditionLabels[listing.condition]} · ${formatPaise(
    listing.sellingPriceInPaise,
  )} · ${listing.city}.`;
  return metaDescription(`${lead} ${listing.description}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id).catch(() => null);
  // A listing that no longer resolves renders the 404 below — keep it out of
  // the index rather than letting it inherit the site defaults.
  if (!listing) return { title: "Listing not found", robots: { index: false, follow: false } };

  return pageMetadata({
    title: `${listing.title} — ${listing.category.name}`,
    description: describe(listing),
    path: `/listings/${listing.id}`,
    // The listing's own photos are what a shopper should see when the link is
    // shared, not the generic marketplace card.
    images: listing.images.length
      ? listing.images.slice(0, 4).map((url) => ({ url, alt: listing.title }))
      : undefined,
  });
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anonymous fetch on purpose: this route must keep returning a real 404 for
  // anything not publicly live. Admins review unapproved items at
  // /admin/listings/[id], which fetches with their token.
  const listing = await getListing(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

  // More from the same category — drop the current item, keep up to 4.
  const related: Listing[] = await getListings({ category: listing.category.slug, pageSize: 5 })
    .then((r) => r.items.filter((l) => l.id !== listing.id).slice(0, 4))
    .catch(() => []);

  return (
    <>
      <JsonLd
        data={[
          listingJsonLd(listing),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop preloved", path: "/listings" },
            { name: listing.category.name, path: `/categories/${listing.category.slug}` },
            { name: listing.title, path: `/listings/${listing.id}` },
          ]),
        ]}
      />
      <ListingDetail listing={listing} related={related} />
    </>
  );
}
