"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { BlogPost } from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { revalidateBlogPages } from "@/lib/revalidate-blog";
import { toast } from "@/lib/toast-store";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

export default function AdminBlogPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: () => authedRequest<BlogPost[]>("/admin/blog"),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-blog"] });

  const setPublished = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      authedRequest<BlogPost>(`/admin/blog/${id}/publish`, { method: "PATCH", body: { published } }),
    onSuccess: (post) => {
      invalidate();
      // Drops the cached public pages so the change is live immediately —
      // especially unpublishing, which otherwise leaves the post readable.
      void revalidateBlogPages();
      toast.success(post.published ? "Post published" : "Post moved to draft");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't update this post."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => authedRequest(`/admin/blog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      void revalidateBlogPages();
      toast.success("Post deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't delete this post."),
  });

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Content</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Blog</h1>
          <p className="mt-2 text-muted-foreground">Write and publish marketplace journal posts.</p>
        </div>
        <Link href="/admin/blog/new" className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> New post
        </Link>
      </header>

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <StatePanel title="No posts yet" description="Create the first post to populate the marketplace journal." />
      ) : (
        <Card className="divide-y divide-border">
          {data.map((post) => (
            <div key={post.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <Link href={`/admin/blog/${post.id}/edit`} className="truncate hover:text-accent">{post.title}</Link>
                  <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    post.published ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">/{post.slug} · by {post.authorName}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={post.published ? "Unpublish" : "Publish"}
                  disabled={setPublished.isPending}
                  onClick={() => setPublished.mutate({ id: post.id, published: !post.published })}
                >
                  {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Link href={`/admin/blog/${post.id}/edit`} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => {
                    if (window.confirm(`Delete "${post.title}"?`)) remove.mutate(post.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
