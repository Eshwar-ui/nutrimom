import type { Listing } from "@nutrimom/shared";

/**
 * "City · Locality" (or just the city). The one way a listing's location is
 * shown publicly — the PIN code is never part of it, and isn't on the public
 * Listing type to begin with.
 */
export function listingPlace(listing: Pick<Listing, "city" | "locality">): string {
  const locality = listing.locality?.trim();
  return locality ? `${listing.city} · ${locality}` : listing.city;
}
