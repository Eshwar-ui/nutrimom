import Link from "next/link";
import {
  Search, SearchX, SlidersHorizontal, Store, LayoutGrid, ChevronDown,
  Shirt, ToyBrick, BookOpen, Utensils, Baby, Footprints, CarFront,
  RockingChair, Bed, Armchair, Backpack, Milk, Heart, PersonStanding,
  Moon, Lamp, Package,
} from "lucide-react";
import {
  conditionLabels,
  type Category,
  type Listing,
  type Paginated,
} from "@nutrimom/shared";
import { getCategories, getListings } from "@/lib/listings";
import { Container, Input } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import { ListingsSort } from "@/components/listings-sort";
import { StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

export const metadata = { title: "Shop preloved" };

/** Per-category sidebar icons, keyed by slug. Unmapped categories fall back
 *  to Store, so new categories still render without a code change. */
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "baby-clothes": Shirt,
  toys: ToyBrick,
  books: BookOpen,
  "feeding-essentials": Utensils,
  strollers: Baby,
  walkers: Footprints,
  "car-seats": CarFront,
  cradles: RockingChair,
  cots: Bed,
  "high-chairs": Armchair,
  "baby-carriers": Backpack,
  "breast-pumps": Milk,
  "nursing-pillows": Heart,
  "maternity-wear": PersonStanding,
  "pregnancy-pillows": Moon,
  "nursery-furniture": Lamp,
  "other-baby-essentials": Package,
};

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

  const activeCategoryName = categories.find((c) => c.slug === sp.category)?.name ?? "All Products";

  const hrefWith = (over: Partial<SP>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...sp, ...over })) {
      if (value) params.set(key, String(value));
    }
    const query = params.toString();
    return `/listings${query ? `?${query}` : ""}`;
  };

  return (
    <Container className="py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Shop preloved</h1>
        <p className="mt-2 text-muted-foreground">{data.total} treasure{data.total === 1 ? "" : "s"} waiting for a new home.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* ---- Desktop sidebar rail: collections + filters ---- */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <section>
              <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">Collections</h2>
              <nav className="space-y-1">
                <CollectionLink href={hrefWith({ category: undefined, page: undefined })} active={!sp.category} icon={LayoutGrid}>
                  All Products
                </CollectionLink>
                {categories.map((category) => (
                  <CollectionLink
                    key={category.id}
                    href={hrefWith({ category: category.slug, page: undefined })}
                    active={sp.category === category.slug}
                    icon={categoryIcons[category.slug] ?? Store}
                  >
                    {category.name}
                  </CollectionLink>
                ))}
              </nav>
            </section>

            <div className="border-t border-border" />

            <FiltersForm sp={sp} />
          </div>
        </aside>

        {/* ---- Main column ---- */}
        <div className="min-w-0">
          {/* Search + sort */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <form action="/listings" method="get" role="search" className="relative flex-1">
              <PreservedFields sp={sp} except={["search", "page"]} />
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search products"
                name="search"
                defaultValue={sp.search ?? ""}
                placeholder="Search products…"
                className="h-12 rounded-2xl pl-12 pr-4 text-base"
              />
            </form>
            <ListingsSort sp={sp} />
          </div>

          {/* Mobile collections + filters (sidebar is hidden below lg) */}
          <div className="mb-6 space-y-3 lg:hidden">
            <details className="group rounded-2xl border border-border-control/45 bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-foreground">
                <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Collections</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {activeCategoryName}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="max-h-72 space-y-1 overflow-y-auto border-t border-border p-2">
                <CollectionLink href={hrefWith({ category: undefined, page: undefined })} active={!sp.category} icon={LayoutGrid}>
                  All Products
                </CollectionLink>
                {categories.map((category) => (
                  <CollectionLink
                    key={category.id}
                    href={hrefWith({ category: category.slug, page: undefined })}
                    active={sp.category === category.slug}
                    icon={categoryIcons[category.slug] ?? Store}
                  >
                    {category.name}
                  </CollectionLink>
                ))}
              </div>
            </details>
            <details className="group rounded-2xl border border-border-control/45 bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-foreground">
                <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</span>
                <span className="text-xs text-muted-foreground group-open:hidden">Condition, city and price</span>
              </summary>
              <div className="border-t border-border p-4">
                <FiltersForm sp={sp} />
              </div>
            </details>
          </div>

          {loadFailed ? (
            <StatePanel tone="error" title="The shop could not load" description="The marketplace service is unavailable right now. Refresh the page in a moment." action={<Link href="/listings" className={buttonVariants()}>Try again</Link>} />
          ) : data.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {data.items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <StatePanel icon={SearchX} title="No treasures found" description="Try another collection, remove a filter, or search a nearby city." />
          )}

          {data.totalPages > 1 && (
            <nav aria-label="Catalog pages" className="mt-12 flex items-center justify-center gap-3">
              {page > 1 && <Link href={hrefWith({ page: String(page - 1) })} className={buttonVariants({ variant: "outline", size: "sm" })}>Previous</Link>}
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              {page < data.totalPages && <Link href={hrefWith({ page: String(page + 1) })} className={buttonVariants({ variant: "outline", size: "sm" })}>Next</Link>}
            </nav>
          )}
        </div>
      </div>
    </Container>
  );
}

/** Hidden inputs so a filter/search GET form preserves the other active
 *  params instead of wiping them on submit. */
function PreservedFields({ sp, except }: { sp: SP; except: (keyof SP)[] }) {
  return (
    <>
      {(Object.entries(sp) as [keyof SP, string | undefined][])
        .filter(([key, value]) => value && !except.includes(key))
        .map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
    </>
  );
}

function CollectionLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {children}
    </Link>
  );
}

const conditionOptions = [{ value: "", label: "Any" }, ...Object.entries(conditionLabels).map(([value, label]) => ({ value, label }))];

function FiltersForm({ sp }: { sp: SP }) {
  return (
    <form action="/listings" method="get" className="space-y-5">
      <PreservedFields sp={sp} except={["condition", "city", "min", "max", "page"]} />

      <fieldset>
        <legend className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Condition</legend>
        <div className="flex flex-wrap gap-2">
          {conditionOptions.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="condition"
                value={option.value}
                defaultChecked={(sp.condition ?? "") === option.value}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-full border border-border-control/45 bg-surface px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="filter-city" className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">City</label>
        <Input id="filter-city" name="city" defaultValue={sp.city ?? ""} placeholder="Any city" />
      </div>

      <div>
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Price (₹)</span>
        <div className="flex items-center gap-2">
          <Input aria-label="Minimum price" name="min" type="number" min="0" defaultValue={sp.min ?? ""} placeholder="Min" />
          <span className="text-muted-foreground">–</span>
          <Input aria-label="Maximum price" name="max" type="number" min="0" defaultValue={sp.max ?? ""} placeholder="Max" />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={cn(buttonVariants(), "flex-1")}>Apply</button>
        {(sp.condition || sp.city || sp.min || sp.max) && (
          <Link
            href={{ pathname: "/listings", query: cleanQuery({ ...sp, condition: undefined, city: undefined, min: undefined, max: undefined, page: undefined }) }}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}

function cleanQuery(sp: SP): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) if (value) out[key] = String(value);
  return out;
}
