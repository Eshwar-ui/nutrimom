"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleHelp, Eye, EyeOff, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import {
  FAQ_SECTION_LABELS,
  faqInputSchema,
  type Faq,
  type FaqInput,
  type FaqSection,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { revalidatePublicPages } from "@/lib/revalidate";
import { apiIssues, errorMessage, optionalInt, zodIssues, type FormIssues } from "@/lib/admin-content";
import { toast } from "@/lib/toast-store";
import { Card, Input, Select, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import {
  AdminPageHeader,
  CheckboxField,
  ConfirmDeleteDialog,
  Field,
  FormAlert,
  SectionHeading,
  StatusChip,
} from "@/components/admin-form";
import { MarkdownContent } from "@/components/markdown-content";
import { markdownExcerpt } from "@/lib/blog";

const QUERY_KEY = ["admin-faqs"];
const SECTIONS = Object.keys(FAQ_SECTION_LABELS) as FaqSection[];

function faqToInput(faq: Faq): FaqInput {
  return {
    section: faq.section,
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sortOrder,
    isPublished: faq.isPublished,
  };
}

type Editing = { faq?: Faq; section?: FaqSection } | null;

export default function AdminFaqsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => authedRequest<Faq[]>("/admin/faqs"),
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);

  // The editor replaces the list in place; without this it opens wherever the
  // list happened to be scrolled, often half-way down the form.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [editing]);

  const afterChange = () => {
    void qc.invalidateQueries({ queryKey: QUERY_KEY });
    void revalidatePublicPages("faqs");
  };

  const setPublished = useMutation({
    mutationFn: (faq: Faq) =>
      authedRequest<Faq>(`/admin/faqs/${faq.id}`, {
        method: "PUT",
        body: { ...faqToInput(faq), isPublished: !faq.isPublished },
      }),
    onSuccess: (faq) => {
      afterChange();
      toast.success(faq.isPublished ? "FAQ published" : "FAQ moved to draft");
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't update this FAQ")),
  });

  const remove = useMutation({
    mutationFn: (faq: Faq) => authedRequest(`/admin/faqs/${faq.id}`, { method: "DELETE" }),
    onSuccess: () => {
      afterChange();
      setDeleting(null);
      toast.success("FAQ deleted");
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't delete this FAQ")),
  });

  if (editing) {
    return (
      <div>
        <AdminPageHeader
          eyebrow="FAQs"
          title={editing.faq ? "Edit FAQ" : "New FAQ"}
          description="Answers that quote live figures — the cancellation window, membership prices — are written by the site itself, so they always match what's enforced. Don't repeat those numbers here."
        />
        <FaqEditor
          initial={editing.faq}
          defaultSection={editing.section}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            afterChange();
            toast.success(editing.faq ? "FAQ saved" : "FAQ added");
            setEditing(null);
          }}
        />
      </div>
    );
  }

  const faqs = data ?? [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="FAQs"
        description="Questions and answers on the FAQ page and beneath each service's prices. Drafts stay hidden."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> New FAQ
          </Button>
        }
      />

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : isError ? (
        <StatePanel
          tone="error"
          title="Couldn't load the FAQs"
          description="Check your connection and try again."
          action={<Button variant="outline" onClick={() => void refetch()}>Try again</Button>}
        />
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const rows = faqs.filter((f) => f.section === section);
            return (
              <section key={section} aria-labelledby={`faq-${section}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id={`faq-${section}`} className="text-lg font-semibold text-foreground">
                    {FAQ_SECTION_LABELS[section]}
                  </h2>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing({ section })}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
                {rows.length === 0 ? (
                  <p className="rounded-card border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                    No questions in this section yet.
                  </p>
                ) : (
                  <Card className="divide-y divide-border">
                    {rows.map((faq) => (
                      <div key={faq.id} className="flex flex-wrap items-center gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                            <button type="button" onClick={() => setEditing({ faq })} className="text-left hover:text-accent-text">
                              {faq.question}
                            </button>
                            {!faq.isPublished && <StatusChip>Draft</StatusChip>}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {markdownExcerpt(faq.answer, "").slice(0, 160)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">order {faq.sortOrder}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={faq.isPublished ? "Unpublish" : "Publish"}
                            title={faq.isPublished ? "Move to draft" : "Publish"}
                            disabled={setPublished.isPending && setPublished.variables?.id === faq.id}
                            onClick={() => setPublished.mutate(faq)}
                          >
                            {faq.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ faq })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Delete" className="hover:text-danger" onClick={() => setDeleting(faq)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title="Delete this FAQ?"
          description={`“${deleting.question}” will be removed from the site straight away. To hide it for now, move it to draft instead.`}
          pending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting)}
        />
      )}
    </div>
  );
}

function FaqEditor({
  initial,
  defaultSection,
  onCancel,
  onSaved,
}: {
  initial?: Faq;
  defaultSection?: FaqSection;
  onCancel: () => void;
  onSaved: (faq: Faq) => void;
}) {
  const [form, setForm] = useState({
    section: initial?.section ?? defaultSection ?? "GENERAL",
    question: initial?.question ?? "",
    answer: initial?.answer ?? "",
    sortOrder: initial?.sortOrder?.toString() ?? "0",
    isPublished: initial?.isPublished ?? true,
  });
  const [preview, setPreview] = useState(false);
  const [issues, setIssues] = useState<FormIssues>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError(null);
    const sortOrder = optionalInt(form.sortOrder) ?? 0;
    const parsed = faqInputSchema.safeParse({ ...form, sortOrder });
    if (!parsed.success || Number.isNaN(sortOrder)) {
      setIssues({
        ...(parsed.success ? {} : zodIssues(parsed.error)),
        ...(Number.isNaN(sortOrder) ? { sortOrder: "Enter a whole number" } : {}),
      });
      setError("Check the highlighted details before saving.");
      return;
    }
    setIssues({});
    setBusy(true);
    try {
      const saved = initial
        ? await authedRequest<Faq>(`/admin/faqs/${initial.id}`, { method: "PUT", body: parsed.data })
        : await authedRequest<Faq>("/admin/faqs", { method: "POST", body: parsed.data });
      onSaved(saved);
    } catch (err) {
      setIssues(apiIssues(err));
      setError(errorMessage(err, "Couldn't save this FAQ"));
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-3xl overflow-hidden">
      <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-[1fr_8rem] sm:p-8">
        <legend className="sr-only">Question</legend>
        <div className="sm:col-span-2">
          <SectionHeading icon={CircleHelp} title="Question" />
        </div>
        <Field label="Section" id="faq-section" error={issues.section}>
          <Select id="faq-section" value={form.section} onChange={(e) => set("section", e.target.value as FaqSection)}>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>{FAQ_SECTION_LABELS[s]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Sort order" id="faq-sort" error={issues.sortOrder}>
          <Input id="faq-sort" inputMode="numeric" value={form.sortOrder} aria-invalid={!!issues.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
        </Field>
        <Field label="Question" id="faq-question" error={issues.question} className="sm:col-span-2">
          <Input id="faq-question" value={form.question} maxLength={200} aria-invalid={!!issues.question} onChange={(e) => set("question", e.target.value)} placeholder="Can I join the yoga sessions in my first trimester?" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 border-b border-border p-6 sm:p-8">
        <legend className="sr-only">Answer</legend>
        <div className="flex items-start justify-between gap-3">
          <SectionHeading icon={FileText} title="Answer" description="Markdown supported — bold, links, lists." />
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setPreview((p) => !p)}>
            {preview ? <><EyeOff className="h-4 w-4" /> Edit</> : <><Eye className="h-4 w-4" /> Preview</>}
          </Button>
        </div>
        {preview ? (
          <div className="min-h-[10rem] rounded-xl border border-border p-4">
            <MarkdownContent markdown={form.answer || "*Nothing to preview yet.*"} />
          </div>
        ) : (
          <Textarea
            id="faq-answer"
            aria-label="Answer"
            rows={8}
            maxLength={4000}
            value={form.answer}
            aria-invalid={!!issues.answer}
            onChange={(e) => set("answer", e.target.value)}
            className="font-mono text-sm"
            placeholder={"Yes — most mothers start after the first scan. **Check with your doctor first.**"}
          />
        )}
        {issues.answer && <p className="text-xs text-danger">{issues.answer}</p>}
      </fieldset>

      <div className="p-6 sm:p-8">
        <CheckboxField id="faq-published" checked={form.isPublished} onChange={(v) => set("isPublished", v)} label="Published" description="Untick to keep it as a draft." />
      </div>

      {error && (
        <div className="px-6 pb-6 sm:px-8">
          <FormAlert message={error} />
        </div>
      )}
      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:p-6">
        <Button size="lg" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button size="lg" onClick={submit} disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add FAQ"}</Button>
      </div>
    </Card>
  );
}
