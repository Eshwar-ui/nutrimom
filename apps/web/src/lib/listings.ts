import { request } from "./api";
import type {
  Category,
  Listing,
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
