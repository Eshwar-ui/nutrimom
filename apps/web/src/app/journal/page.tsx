import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import {
  BLOG_CATEGORIES,
  blogCategoryBySlug,
  blogCategoryByValue,
  type BlogPost,
  type Paginated,
} from "@nutrimom/shared";
import { getBlogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { Container, Card } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/states";
import { ListingThumb } from "@/components/ui/listing-thumb";

const JOURNAL_DESCRIPTION =
  "Practical writing on pregnancy, yoga, postpartum recovery, nutrition, starting solids, toddler life and conscious reuse — from the moms behind The Nurture Moms.";

/**
 * Category views get their own title, description and canonical, and stay
 * indexable.
 *
 * Deliberately unlike the faceted `/listings` params, which are noindex: those
 * are an open combinatorial space that competes with the pages it duplicates.
 * These are ten fixed topics named by the brief (section 11), each a page a
 * reader could reasonably land on from search.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const active = sp.category ? blogCategoryBySlug(sp.category) : null;
  if (!active) {
    return pageMetadata({
      title: "The Nurture Journal",
      description: JOURNAL_DESCRIPTION,
      path: "/journal",
    });
  }
  return pageMetadata({
    // Absolute, so the layout's "· The Nurture Moms" suffix is skipped —
    // "The Nurture Journal" already carries the brand, and the template would
    // otherwise print "The Nurture" twice in one title.
    absoluteTitle: `${active.label} · The Nurture Journal`,
    description: `${active.label} writing from The Nurture Moms — practical notes for Indian moms on ${active.label.toLowerCase()}.`,
    path: `/journal?category=${active.slug}`,
  });
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  // An unknown slug reads as no filter rather than 404ing: a stale category
  // link should still land the reader on the journal, not on an error.
  const active = sp.category ? blogCategoryBySlug(sp.category) : null;
  const qs = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    if (active) params.set("category", active.slug);
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined) params.delete(k);
      else params.set(k, String(v));
    }
    const str = params.toString();
    return str ? `/journal?${str}` : "/journal";
  };

  let data: Paginated<BlogPost> = { items: [], page, pageSize: 12, total: 0, totalPages: 1 };
  try {
    data = await getBlogPosts(page, active?.value);
  } catch {
    // Falls through to the empty state below.
  }

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Move. Nourish. Connect. Pass it on.</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">The Nurture Journal</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{JOURNAL_DESCRIPTION}</p>

      {/* Category filter. Every category is listed, not only those with posts:
          the set is the journal's published shape, and a chip that appears only
          once something is written under it makes the navigation move around
          as the journal fills. */}
      <nav aria-label="Filter by category" className="mt-7 flex flex-wrap gap-2">
        <Link
          href="/journal"
          aria-current={active ? undefined : "page"}
          className={cn(
            "rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors",
            active
              ? "border-border bg-surface text-muted-foreground hover:text-foreground"
              : "border-primary bg-primary text-primary-foreground",
          )}
        >
          All
        </Link>
        {BLOG_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/journal?category=${c.slug}`}
            aria-current={active?.value === c.value ? "page" : undefined}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors",
              active?.value === c.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      {data.items.length === 0 ? (
        <div className="mt-8">
          <StatePanel
            icon={Newspaper}
            title={active ? `Nothing in ${active.label} yet` : "No posts yet"}
            description={
              active
                ? "We haven't published under this category yet — try another, or read everything."
                : "We're putting the first articles together. In the meantime, explore the marketplace."
            }
            action={
              active ? (
                <Link href="/journal" className={buttonVariants()}>Read everything</Link>
              ) : (
                <Link href="/listings" className={buttonVariants()}>Shop preloved</Link>
              )
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {data.items.map((post) => (
            <Link key={post.id} href={`/journal/${post.slug}`}>
              <Card className="flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5 sm:p-5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
                  <ListingThumb src={post.coverImageUrl} alt={post.title} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-foreground sm:text-xl">{post.title}</p>
                  {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {blogCategoryByValue(post.category) && (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-bold text-accent-text">
                        {blogCategoryByValue(post.category)!.label}
                      </span>
                    )}
                    <span>
                      {post.publishedAt && fmtDate(post.publishedAt)} · {post.authorName}
                    </span>
                  </p>
                </div>
              </Card>
            </Link>
          ))}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              {page > 1 && (
                <Link href={qs({ page: page - 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>Previous</Link>
              )}
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              {page < data.totalPages && (
                <Link href={qs({ page: page + 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>Next</Link>
              )}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
