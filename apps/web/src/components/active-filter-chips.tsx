import Link from "next/link";
import { X } from "lucide-react";
import { conditionLabels, deliveryLabels, type Category, type Condition, type DeliveryOption } from "@nutrimom/shared";
import { hasActiveFilters, listingsHref, type ListingsSearchParams } from "@/lib/listings-url";

/**
 * One removable chip per active filter, plus "Clear all" back to every
 * listing. Plain links, so it works without JavaScript and each state is a
 * real URL. The PIN shows here because the buyer typed it — it's their own
 * search, not a seller's address.
 */
export function ActiveFilterChips({ sp, categories }: { sp: ListingsSearchParams; categories: Category[] }) {
  if (!hasActiveFilters(sp)) return null;

  const rupees = (v: string) => `₹${Number(v).toLocaleString("en-IN")}`;
  const chips: { key: string; label: string; href: string }[] = [];
  const add = (key: string, label: string, over: Partial<ListingsSearchParams>) =>
    chips.push({ key, label, href: listingsHref(sp, { ...over, page: undefined }) });

  if (sp.category) add("category", categories.find((c) => c.slug === sp.category)?.name ?? sp.category, { category: undefined });
  if (sp.search) add("search", `“${sp.search}”`, { search: undefined });
  // Removing the city also drops its locality, which means nothing without it.
  if (sp.city) add("city", sp.city, { city: undefined, locality: undefined });
  if (sp.locality) add("locality", sp.locality, { locality: undefined });
  if (sp.pincode) add("pincode", `PIN ${sp.pincode}`, { pincode: undefined });
  if (sp.condition) add("condition", conditionLabels[sp.condition as Condition] ?? sp.condition, { condition: undefined });
  if (sp.delivery) add("delivery", deliveryLabels[sp.delivery as DeliveryOption] ?? sp.delivery, { delivery: undefined });
  if (sp.min || sp.max) {
    const label = sp.min && sp.max ? `${rupees(sp.min)} – ${rupees(sp.max)}` : sp.min ? `From ${rupees(sp.min)}` : `Up to ${rupees(sp.max!)}`;
    add("price", label, { min: undefined, max: undefined });
  }

  return (
    <nav aria-label="Active filters" className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 pl-3.5 pr-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ))}
      <Link href="/listings" className="ml-1 inline-flex min-h-9 items-center px-2 text-sm font-semibold text-accent-text underline-offset-2 hover:underline">
        Clear all
      </Link>
    </nav>
  );
}
