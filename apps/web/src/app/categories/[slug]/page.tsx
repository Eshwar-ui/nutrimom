import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { getCategories, getListings } from "@/lib/listings";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";

const describe = (name: string) =>
  `Shop preloved ${name.toLowerCase()} in India — gently used, honestly graded and listed by verified moms. Buy secondhand ${name.toLowerCase()} at a fraction of retail on The Nurture Moms.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: false } };

  return pageMetadata({
    title: `Preloved ${category.name}`,
    description: describe(category.name),
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const data = await getListings({ category: slug, pageSize: 24 }).catch(() => null);
  const items = data?.items ?? [];

  return (
    <Container className="py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop preloved", path: "/listings" },
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">{category.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {data?.total ?? 0} treasure{(data?.total ?? 0) === 1 ? "" : "s"} in this category.
          </p>
        </div>
        <Link href={`/listings?category=${category.slug}`} className={`${buttonVariants({ variant: "outline", size: "sm" })} gap-1.5`}>
          <SlidersHorizontal className="h-4 w-4" /> Filter &amp; sort
        </Link>
      </header>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-border p-16 text-center text-muted-foreground">
          Nothing in {category.name.toLowerCase()} yet — check back soon.
        </div>
      )}

      {(data?.total ?? 0) > items.length && (
        <div className="mt-10 text-center">
          <Link href={`/listings?category=${category.slug}`} className={buttonVariants({ variant: "outline" })}>See all {data?.total} in {category.name}</Link>
        </div>
      )}
    </Container>
  );
}
