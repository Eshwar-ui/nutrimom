import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getBlogPost } from "@/lib/blog";
import { Container } from "@/components/ui/primitives";
import { MarkdownContent } from "@/components/markdown-content";
import { ListingThumb } from "@/components/ui/listing-thumb";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const post = await getBlogPost(slug);
    return { title: post.title, description: post.excerpt ?? undefined };
  } catch {
    return { title: "Blog" };
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await getBlogPost(slug).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

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

      <MarkdownContent markdown={post.bodyMarkdown} className="mt-8" />
    </Container>
  );
}
