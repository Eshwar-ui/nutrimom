import { notFound } from "next/navigation";
import type { Listing } from "@nutrimom/shared";
import { getListing, getListings } from "@/lib/listings";
import { ApiError } from "@/lib/api";
import { ListingDetail } from "@/components/listing-detail";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const l = await getListing(id);
    return { title: l.title, description: l.description.slice(0, 150) };
  } catch {
    return { title: "Listing" };
  }
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

  return <ListingDetail listing={listing} related={related} />;
}
