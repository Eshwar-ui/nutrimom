"use client";

import { BlogPostForm } from "@/components/blog-post-form";

export default function AdminNewBlogPostPage() {
  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Content</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">New post</h1>
        <p className="mt-2 text-muted-foreground">Saved as a draft until you publish it.</p>
      </header>
      <BlogPostForm />
    </div>
  );
}
