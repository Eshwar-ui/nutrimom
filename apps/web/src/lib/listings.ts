import { request } from "./api";
import type {
  Category,
  Listing,
  ListingLocations,
  ListingQuery,
  Paginated,
  Review,
  SellerProfile,
} from "@nutrimom/shared";

// Server-side reads (public endpoints, cached + revalidated).

export function getListings(
  query: Partial<ListingQuery> = {},
): Promise<Paginated<Listing>> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }
  const suffix = qs.toString();
  return request<Paginated<Listing>>(
    `/listings${suffix ? `?${suffix}` : ""}`,
    { revalidate: 20 },
  );
}

export function getListing(id: string): Promise<Listing> {
  return request<Listing>(`/listings/${encodeURIComponent(id)}`, {
    revalidate: 20,
  });
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories", { revalidate: 300 });
}

export function getSellerProfile(id: string): Promise<SellerProfile> {
  return request<SellerProfile>(`/sellers/${encodeURIComponent(id)}`, {
    revalidate: 20,
  });
}

export function getSellerReviews(id: string): Promise<Review[]> {
  return request<Review[]>(`/sellers/${encodeURIComponent(id)}/reviews`, {
    revalidate: 20,
  });
}

/**
 * Where live listings are: cities with counts, and the localities of `city`
 * when one is given. Feeds the city combobox and locality suggestions. Public
 * and usable from client components too (`revalidate` only applies on the
 * server).
 */
export function getListingLocations(city?: string): Promise<ListingLocations> {
  const qs = city ? `?city=${encodeURIComponent(city)}` : "";
  return request<ListingLocations>(`/listings/locations${qs}`, {
    revalidate: 300,
  });
}
