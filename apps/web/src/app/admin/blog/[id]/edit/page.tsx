"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { BlogPost } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { BlogPostForm } from "@/components/blog-post-form";

export default function AdminEditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["admin-blog-post", id],
    queryFn: () => authedRequest<BlogPost>(`/admin/blog/${id}`),
    retry: false,
  });

  if (isLoading) return <PageSkeleton rows={4} />;
  if (error || !post) {
    return (
      <StatePanel
        tone="error"
        title="Post not found"
        description="It may have been deleted, or the link might be wrong."
        action={<Link href="/admin/blog" className="text-sm underline">Back to blog</Link>}
      />
    );
  }

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Content</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Edit post</h1>
        <p className="mt-2 text-muted-foreground">{post.published ? "This post is live." : "This post is a draft."}</p>
      </header>
      <BlogPostForm initial={post} postId={post.id} />
    </div>
  );
}
