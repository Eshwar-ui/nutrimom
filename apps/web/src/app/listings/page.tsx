import Link from "next/link";
import { ListFilter, Search, SearchX, SlidersHorizontal } from "lucide-react";
import {
  conditionLabels,
  type Category,
  type Listing,
  type Paginated,
} from "@nutrimom/shared";
import { getCategories, getListings } from "@/lib/listings";
import { Container, Input, Select } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

export const metadata = { title: "Shop preloved" };

type SP = {
  category?: string;
  condition?: string;
  city?: string;
  search?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
};

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
];

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  let data: Paginated<Listing> = { items: [], page, pageSize: 12, total: 0, totalPages: 1 };
  let categories: Category[] = [];
  let loadFailed = false;
  try {
    [data, categories] = await Promise.all([
      getListings({
        category: sp.category,
        condition: sp.condition as never,
        city: sp.city,
        search: sp.search,
        minPrice: sp.min ? Number(sp.min) * 100 : undefined,
        maxPrice: sp.max ? Number(sp.max) * 100 : undefined,
        sort: (sp.sort as "newest" | "price-asc" | "price-desc") ?? "newest",
        page,
      }),
      getCategories(),
    ]);
  } catch {
    loadFailed = true;
  }

  const hrefWith = (over: Partial<SP>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...sp, ...over })) {
      if (value) params.set(key, String(value));
    }
    const query = params.toString();
    return `/listings${query ? `?${query}` : ""}`;
  };

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-7">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Shop preloved</h1>
        <p className="mt-2 text-muted-foreground">{data.total} treasure{data.total === 1 ? "" : "s"} waiting for a new home.</p>
      </header>

      <div className="-mx-5 mb-5 flex snap-x gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <Chip href={hrefWith({ category: undefined, page: undefined })} active={!sp.category}>All</Chip>
        {categories.map((category) => (
          <Chip key={category.id} href={hrefWith({ category: category.slug, page: undefined })} active={sp.category === category.slug}>
            {category.name}
          </Chip>
        ))}
      </div>

      <details className="group mb-6 rounded-2xl border border-border-control/45 bg-surface md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-foreground">
          <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</span>
          <span className="text-xs text-muted-foreground group-open:hidden">Search, city, condition and price</span>
        </summary>
        <FiltersForm sp={sp} mobile />
      </details>

      <form action="/listings" method="get" className="mb-8 hidden gap-3 rounded-3xl border border-border-control/45 bg-surface p-4 card-shadow md:grid md:grid-cols-2 lg:grid-cols-6">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search listings" name="search" defaultValue={sp.search ?? ""} placeholder="Search items…" className="pl-9" />
        </div>
        <Input aria-label="City" name="city" defaultValue={sp.city ?? ""} placeholder="City" />
        <Select aria-label="Condition" name="condition" defaultValue={sp.condition ?? ""}>
          <option value="">Any condition</option>
          {Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <div className="flex gap-2">
          <Input aria-label="Minimum price" name="min" type="number" defaultValue={sp.min ?? ""} placeholder="Min ₹" />
          <Input aria-label="Maximum price" name="max" type="number" defaultValue={sp.max ?? ""} placeholder="Max ₹" />
        </div>
        <button type="submit" className={cn(buttonVariants(), "h-11")}>Apply filters</button>
      </form>

      <div className="mb-6 flex items-center gap-1 overflow-x-auto pb-1">
        <ListFilter className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">Sort listings</span>
        {sorts.map((sort) => (
          <Link
            key={sort.value}
            href={hrefWith({ sort: sort.value, page: undefined })}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              (sp.sort ?? "newest") === sort.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {sort.label}
          </Link>
        ))}
      </div>

      {loadFailed ? (
        <StatePanel tone="error" title="The shop could not load" description="The marketplace service is unavailable right now. Refresh the page in a moment." action={<Link href="/listings" className={buttonVariants()}>Try again</Link>} />
      ) : data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {data.items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      ) : (
        <StatePanel icon={SearchX} title="No treasures found" description="Try another category, remove a filter, or search a nearby city." />
      )}

      {data.totalPages > 1 && (
        <nav aria-label="Catalog pages" className="mt-12 flex items-center justify-center gap-3">
          {page > 1 && <Link href={hrefWith({ page: String(page - 1) })} className={buttonVariants({ variant: "outline", size: "sm" })}>Previous</Link>}
          <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
          {page < data.totalPages && <Link href={hrefWith({ page: String(page + 1) })} className={buttonVariants({ variant: "outline", size: "sm" })}>Next</Link>}
        </nav>
      )}
    </Container>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-bold transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border-control/45 bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function FiltersForm({ sp, mobile = false }: { sp: SP; mobile?: boolean }) {
  return (
    <form action="/listings" method="get" className={cn("grid gap-3", mobile && "border-t border-border p-4")}>
      {sp.category && <input type="hidden" name="category" value={sp.category} />}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search listings" name="search" defaultValue={sp.search ?? ""} placeholder="Search items…" className="pl-9" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input aria-label="City" name="city" defaultValue={sp.city ?? ""} placeholder="City" />
        <Select aria-label="Condition" name="condition" defaultValue={sp.condition ?? ""}>
          <option value="">Any condition</option>
          {Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Input aria-label="Minimum price" name="min" type="number" defaultValue={sp.min ?? ""} placeholder="Min ₹" />
        <Input aria-label="Maximum price" name="max" type="number" defaultValue={sp.max ?? ""} placeholder="Max ₹" />
      </div>
      <button type="submit" className={cn(buttonVariants(), "w-full")}>Show results</button>
    </form>
  );
}
