"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, Image as ImageIcon } from "lucide-react";
import { blogPostInputSchema, type BlogPost } from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { revalidatePublicPages } from "@/lib/revalidate";
import { Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/image-uploader";
import { MarkdownContent } from "@/components/markdown-content";

export function BlogPostForm({ initial, postId }: { initial?: BlogPost; postId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    bodyMarkdown: initial?.bodyMarkdown ?? "",
    authorName: initial?.authorName ?? "",
  });
  const [coverImage, setCoverImage] = useState<string[]>(initial?.coverImageUrl ? [initial.coverImageUrl] : []);
  const [preview, setPreview] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setError(null);
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || undefined,
      bodyMarkdown: form.bodyMarkdown,
      coverImageUrl: coverImage[0] || undefined,
      authorName: form.authorName,
    };
    const parsed = blogPostInputSchema.safeParse(payload);
    if (!parsed.success) {
      const nextIssues: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextIssues[String(issue.path[0] ?? "form")] ??= issue.message;
      setIssues(nextIssues);
      setError("Check the highlighted details before saving.");
      return;
    }
    setIssues({});
    setBusy(true);
    try {
      if (postId) await authedRequest(`/admin/blog/${postId}`, { method: "PATCH", body: parsed.data });
      else await authedRequest("/admin/blog", { method: "POST", body: parsed.data });
      // Edits to an already-published post should show on the live page now,
      // not whenever the 60s cache window happens to lapse.
      await revalidatePublicPages("blog");
      router.push("/admin/blog");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save this post");
      setBusy(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Post details</legend>
        <Field label="Title" id="title" error={issues.title} className="sm:col-span-2">
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} aria-invalid={!!issues.title} placeholder="5 things to check before buying a used stroller" />
        </Field>
        <Field label="Slug" id="slug" error={issues.slug} helper="Lowercase, hyphens only — used in the URL">
          <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} aria-invalid={!!issues.slug} placeholder="used-stroller-checklist" />
        </Field>
        <Field label="Author" id="authorName" error={issues.authorName}>
          <Input id="authorName" value={form.authorName} onChange={(e) => set("authorName", e.target.value)} aria-invalid={!!issues.authorName} placeholder="The Nurture Moms team" />
        </Field>
        <Field label="Excerpt" id="excerpt" error={issues.excerpt} helper="Optional — shown on the blog list" className="sm:col-span-2">
          <Textarea id="excerpt" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} maxLength={300} aria-invalid={!!issues.excerpt} placeholder="A quick checklist for evaluating a preloved stroller before you buy." />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-b border-border p-6 sm:p-8">
        <legend className="sr-only">Cover image</legend>
        <SectionHeading icon={ImageIcon} title="Cover image" description="Optional — shown on the blog list and at the top of the post." />
        <ImageUploader initialImages={coverImage} onChange={setCoverImage} max={1} />
      </fieldset>

      <fieldset className="grid gap-5 p-6 sm:p-8">
        <legend className="sr-only">Content</legend>
        <div className="flex items-start justify-between gap-3">
          <SectionHeading icon={FileText} title="Content" description="Markdown supported — headings, bold, links, lists." />
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setPreview((p) => !p)}>
            {preview ? <><EyeOff className="h-4 w-4" /> Edit</> : <><Eye className="h-4 w-4" /> Preview</>}
          </Button>
        </div>
        {preview ? (
          <div className="min-h-[16rem] rounded-xl border border-border p-4">
            {/* Same offset/title handling as the live post page, so the
                preview is what a reader actually gets. */}
            <MarkdownContent
              markdown={form.bodyMarkdown || "*Nothing to preview yet.*"}
              headingOffset={1}
              dropTitle={form.title}
            />
          </div>
        ) : (
          <Textarea
            id="bodyMarkdown"
            value={form.bodyMarkdown}
            onChange={(e) => set("bodyMarkdown", e.target.value)}
            rows={16}
            aria-invalid={!!issues.bodyMarkdown}
            className="font-mono text-sm"
            placeholder={"## Heading\n\nWrite the post in Markdown..."}
          />
        )}
        {issues.bodyMarkdown && <p className="text-xs text-danger">{issues.bodyMarkdown}</p>}
      </fieldset>

      {error && <p role="alert" className="mx-6 mt-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger sm:mx-8">{error}</p>}
      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:p-6">
        <Button size="lg" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button size="lg" onClick={submit} disabled={busy}>{busy ? "Saving..." : postId ? "Save changes" : "Create post"}</Button>
      </div>
    </Card>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof FileText; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-foreground">{title}</h2><p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p></div></div>;
}

function Field({ label, id, helper, error, className, children }: { label: string; id: string; helper?: string; error?: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><div className="flex items-center justify-between gap-3"><Label htmlFor={id}>{label}</Label>{helper && <span className="mb-1.5 text-xs text-muted-foreground">{helper}</span>}</div>{children}{error && <p className="mt-1.5 text-xs text-danger">{error}</p>}</div>;
}
