import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import type { BlogPost, Paginated } from "@nutrimom/shared";
import { getBlogPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";
import { Container, Card } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/states";
import { ListingThumb } from "@/components/ui/listing-thumb";

const BLOG_DESCRIPTION =
  "Guides on buying and selling preloved baby gear, care tips and stories from our community.";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description: BLOG_DESCRIPTION,
  path: "/blog",
});

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  let data: Paginated<BlogPost> = { items: [], page, pageSize: 12, total: 0, totalPages: 1 };
  try {
    data = await getBlogPosts(page);
  } catch {
    // Falls through to the empty state below.
  }

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">The Nurture journal</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">Blog</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{BLOG_DESCRIPTION}</p>

      {data.items.length === 0 ? (
        <div className="mt-8">
          <StatePanel
            icon={Newspaper}
            title="No posts yet"
            description="We're putting the first articles together. In the meantime, explore the marketplace."
            action={<Link href="/listings" className={buttonVariants()}>Shop preloved</Link>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {data.items.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5 sm:p-5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
                  <ListingThumb src={post.coverImageUrl} alt={post.title} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-foreground sm:text-xl">{post.title}</p>
                  {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {post.publishedAt && fmtDate(post.publishedAt)} · {post.authorName}
                  </p>
                </div>
              </Card>
            </Link>
          ))}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              {page > 1 && (
                <Link href={`/blog?page=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Previous</Link>
              )}
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              {page < data.totalPages && (
                <Link href={`/blog?page=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Next</Link>
              )}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
