import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getBlogPost } from "@/lib/blog";
import { Container } from "@/components/ui/primitives";
import { MarkdownContent } from "@/components/markdown-content";
import { ListingThumb } from "@/components/ui/listing-thumb";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug).catch(() => null);
  if (!post) return { title: "Blog" };

  // Redirect from here rather than from the component below: metadata resolves
  // before the response starts streaming, so this emits a real HTTP 308. Once
  // the render has begun Next can only fall back to a client-side meta refresh,
  // which is a much weaker signal to a crawler. Deliberately not inside a
  // try/catch — permanentRedirect works by throwing.
  if (post.slug !== slug) permanentRedirect(`/blog/${post.slug}`);

  const description = post.excerpt ?? undefined;
  // Canonical points at the post's current slug, so a retired slug that's
  // still linked from elsewhere consolidates onto one URL.
  const url = `/blog/${post.slug}`;
  const images = post.coverImageUrl ? [post.coverImageUrl] : undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      images,
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.authorName],
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await getBlogPost(slug).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

  // Resolved through a slug this post used to live at — send the visitor (and
  // any crawler) on to the current address instead of serving the post at two
  // URLs. Outside the catch above: permanentRedirect signals via a thrown
  // NEXT_REDIRECT that must not be swallowed.
  if (post.slug !== slug) permanentRedirect(`/blog/${post.slug}`);

  return (
    <Container className="max-w-2xl py-12 sm:py-16">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {post.publishedAt && fmtDate(post.publishedAt)} · {post.authorName}
        </p>
      </header>

      {post.coverImageUrl && (
        <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          <ListingThumb src={post.coverImageUrl} alt={post.title} />
        </div>
      )}

      <MarkdownContent
        markdown={post.bodyMarkdown}
        className="mt-8"
        headingOffset={1}
        dropTitle={post.title}
      />
    </Container>
  );
}
