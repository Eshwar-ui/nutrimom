import { PINCODE_REGEX, conditionLabels, deliveryLabels } from "@nutrimom/shared";

/**
 * The /listings URL is the single source of truth for search, filters, sort
 * and page, so any combination can be shared, bookmarked and crawled. Prices
 * are in whole rupees here (the API takes paise).
 */
export type ListingsSearchParams = {
  category?: string;
  condition?: string;
  delivery?: string;
  city?: string;
  locality?: string;
  pincode?: string;
  search?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
};

/** Every key that narrows the results (sort and page don't). */
export const FILTER_KEYS = [
  "category",
  "search",
  "city",
  "locality",
  "pincode",
  "condition",
  "delivery",
  "min",
  "max",
] as const satisfies readonly (keyof ListingsSearchParams)[];

/** `/listings?…` from the current params with some replaced or removed (undefined/""). */
export function listingsHref(
  sp: ListingsSearchParams,
  over: Partial<ListingsSearchParams> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...sp, ...over })) {
    if (typeof value === "string" && value.trim()) params.set(key, value.trim());
  }
  const query = params.toString();
  return `/listings${query ? `?${query}` : ""}`;
}

export function hasActiveFilters(sp: ListingsSearchParams): boolean {
  return FILTER_KEYS.some((key) => !!sp[key]?.trim());
}

/**
 * Drops values the API would reject with a 400 (a malformed PIN, an unknown
 * condition), so a hand-edited or stale URL degrades to "no such filter"
 * rather than "the shop could not load".
 */
export function cleanListingsParams(sp: ListingsSearchParams): ListingsSearchParams {
  const rupees = (v?: string) => (v && /^\d+$/.test(v.trim()) ? v.trim() : undefined);
  return {
    ...sp,
    pincode: sp.pincode && PINCODE_REGEX.test(sp.pincode.trim()) ? sp.pincode.trim() : undefined,
    condition: sp.condition && sp.condition in conditionLabels ? sp.condition : undefined,
    delivery: sp.delivery && sp.delivery in deliveryLabels ? sp.delivery : undefined,
    min: rupees(sp.min),
    max: rupees(sp.max),
  };
}
