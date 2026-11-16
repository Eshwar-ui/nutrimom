"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, Plus, Quote, ShieldCheck, Trash2, UserRound } from "lucide-react";
import {
  testimonialInputSchema,
  type Testimonial,
  type TestimonialInput,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { revalidatePublicPages } from "@/lib/revalidate";
import { apiIssues, errorMessage, optionalInt, zodIssues, type FormIssues } from "@/lib/admin-content";
import { toast } from "@/lib/toast-store";
import { Card, Input, Textarea } from "@/components/ui/primitives";
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
import { AdminImageField } from "@/components/admin-image-field";

const QUERY_KEY = ["admin-testimonials"];

/** The exact consent wording the brief asks the admin to confirm. */
const CONSENT_LABEL = "I have the mother's written permission to publish this";

function testimonialToInput(t: Testimonial): TestimonialInput {
  return {
    name: t.name,
    context: t.context,
    quote: t.quote,
    photoUrl: t.photoUrl,
    consentConfirmed: t.consentConfirmed,
    isPublished: t.isPublished,
    sortOrder: t.sortOrder,
  };
}

type Editing = { testimonial?: Testimonial } | null;

export default function AdminTestimonialsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => authedRequest<Testimonial[]>("/admin/testimonials"),
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);

  // The editor replaces the list in place; without this it opens wherever the
  // list happened to be scrolled, often half-way down the form.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [editing]);

  const afterChange = () => {
    void qc.invalidateQueries({ queryKey: QUERY_KEY });
    // Testimonials render on the home and About pages, both in this scope.
    void revalidatePublicPages("content");
  };

  const setPublished = useMutation({
    mutationFn: (t: Testimonial) =>
      authedRequest<Testimonial>(`/admin/testimonials/${t.id}`, {
        method: "PUT",
        body: { ...testimonialToInput(t), isPublished: !t.isPublished },
      }),
    onSuccess: (t) => {
      afterChange();
      toast.success(t.isPublished ? "Testimonial published" : "Testimonial moved to draft");
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't update this testimonial")),
  });

  const remove = useMutation({
    mutationFn: (t: Testimonial) => authedRequest(`/admin/testimonials/${t.id}`, { method: "DELETE" }),
    onSuccess: () => {
      afterChange();
      setDeleting(null);
      toast.success("Testimonial deleted");
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't delete this testimonial")),
  });

  if (editing) {
    return (
      <div>
        <AdminPageHeader
          eyebrow="Testimonials"
          title={editing.testimonial ? `Edit ${editing.testimonial.name}'s testimonial` : "New testimonial"}
          description="Only real words from real mothers, with their written permission. A testimonial can't be published until that permission is confirmed."
        />
        <TestimonialEditor
          initial={editing.testimonial}
          onCancel={() => setEditing(null)}
          onSaved={(t) => {
            afterChange();
            toast.success(t.isPublished ? "Testimonial saved and published" : "Testimonial saved as a draft");
            setEditing(null);
          }}
        />
      </div>
    );
  }

  const testimonials = data ?? [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Testimonials"
        description="Shown on the home and About pages. The section stays hidden until at least one consented testimonial is published."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> New testimonial
          </Button>
        }
      />

      {isLoading ? (
        <PageSkeleton rows={3} />
      ) : isError ? (
        <StatePanel
          tone="error"
          title="Couldn't load the testimonials"
          description="Check your connection and try again."
          action={<Button variant="outline" onClick={() => void refetch()}>Try again</Button>}
        />
      ) : testimonials.length === 0 ? (
        <StatePanel
          icon={Quote}
          title="No testimonials yet"
          description="Add one once a mother has given written permission to publish her words."
          action={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New testimonial</Button>}
        />
      ) : (
        <Card className="divide-y divide-border">
          {testimonials.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted">
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an uploaded URL
                  <img src={t.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-5 w-5 text-muted-foreground" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  <button type="button" onClick={() => setEditing({ testimonial: t })} className="text-left hover:text-accent-text">
                    {t.name}
                  </button>
                  {t.isPublished ? <StatusChip tone="primary">Published</StatusChip> : <StatusChip>Draft</StatusChip>}
                  {!t.consentConfirmed && <StatusChip tone="gold">Awaiting permission</StatusChip>}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {t.context && <>{t.context} · </>}“{t.quote}”
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.isPublished ? `Unpublish ${t.name}'s testimonial` : `Publish ${t.name}'s testimonial`}
                  title={
                    t.isPublished
                      ? "Move to draft"
                      : t.consentConfirmed
                        ? "Publish"
                        : "Confirm her written permission before publishing"
                  }
                  // Publishing needs consent; unpublishing never does.
                  disabled={(!t.isPublished && !t.consentConfirmed) || (setPublished.isPending && setPublished.variables?.id === t.id)}
                  onClick={() => setPublished.mutate(t)}
                >
                  {t.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Edit ${t.name}'s testimonial`} onClick={() => setEditing({ testimonial: t })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Delete ${t.name}'s testimonial`} className="hover:text-danger" onClick={() => setDeleting(t)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title={`Delete ${deleting.name}'s testimonial?`}
          description="It disappears from the site straight away. This can't be undone."
          pending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting)}
        />
      )}
    </div>
  );
}

function TestimonialEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Testimonial;
  onCancel: () => void;
  onSaved: (t: Testimonial) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    context: initial?.context ?? "",
    quote: initial?.quote ?? "",
    photoUrl: initial?.photoUrl ?? "",
    consentConfirmed: initial?.consentConfirmed ?? false,
    isPublished: initial?.isPublished ?? false,
    sortOrder: initial?.sortOrder?.toString() ?? "0",
  });
  const [issues, setIssues] = useState<FormIssues>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Withdrawing consent takes the testimonial down with it, so the form can
  // never hold "published without permission" even for a moment.
  const setConsent = (consent: boolean) =>
    setForm((f) => ({ ...f, consentConfirmed: consent, isPublished: consent ? f.isPublished : false }));

  const submit = async () => {
    setError(null);
    const sortOrder = optionalInt(form.sortOrder) ?? 0;
    const parsed = testimonialInputSchema.safeParse({ ...form, sortOrder });
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
        ? await authedRequest<Testimonial>(`/admin/testimonials/${initial.id}`, { method: "PUT", body: parsed.data })
        : await authedRequest<Testimonial>("/admin/testimonials", { method: "POST", body: parsed.data });
      onSaved(saved);
    } catch (err) {
      setIssues(apiIssues(err));
      setError(errorMessage(err, "Couldn't save this testimonial"));
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-3xl overflow-hidden">
      <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Testimonial</legend>
        <div className="sm:col-span-2">
          <SectionHeading icon={Quote} title="Her words" description="Quote her as she wrote it — light edits for spelling only." />
        </div>
        <Field label="Name" id="t-name" error={issues.name} helper="As she agreed to be named, e.g. a first name.">
          <Input id="t-name" value={form.name} maxLength={80} aria-invalid={!!issues.name} onChange={(e) => set("name", e.target.value)} placeholder="Priya" />
        </Field>
        <Field label="Context" id="t-context" error={issues.context} helper="Optional — the service and city.">
          <Input id="t-context" value={form.context} maxLength={80} aria-invalid={!!issues.context} onChange={(e) => set("context", e.target.value)} placeholder="Prenatal yoga · Hyderabad" />
        </Field>
        <Field label="Testimonial" id="t-quote" error={issues.quote} className="sm:col-span-2">
          <Textarea id="t-quote" rows={5} maxLength={1000} value={form.quote} aria-invalid={!!issues.quote} onChange={(e) => set("quote", e.target.value)} />
        </Field>
        <Field label="Photo" id="t-photo" error={issues.photoUrl} helper="Optional — only with her permission to show it." className="sm:col-span-2">
          <AdminImageField id="t-photo" value={form.photoUrl} onChange={(url) => set("photoUrl", url)} aspect="square" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 border-b border-border p-6 sm:p-8">
        <legend className="sr-only">Permission and publishing</legend>
        <SectionHeading icon={ShieldCheck} title="Permission" description="Publishing is locked until her written permission is confirmed." />
        <CheckboxField
          id="t-consent"
          checked={form.consentConfirmed}
          onChange={setConsent}
          label={CONSENT_LABEL}
          description="Keep the message or email where she gave it. Unticking this unpublishes the testimonial."
          error={issues.consentConfirmed}
        />
        <CheckboxField
          id="t-published"
          checked={form.isPublished}
          onChange={(v) => set("isPublished", v)}
          disabled={!form.consentConfirmed}
          label="Publish on the site"
          description={form.consentConfirmed ? "Shown on the home and About pages." : "Confirm her permission above first."}
        />
        <Field label="Sort order" id="t-sort" error={issues.sortOrder} helper="Lower numbers come first.">
          <Input id="t-sort" inputMode="numeric" value={form.sortOrder} aria-invalid={!!issues.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="max-w-[8rem]" />
        </Field>
      </fieldset>

      {error && (
        <div className="px-6 pt-6 sm:px-8">
          <FormAlert message={error} />
        </div>
      )}
      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:p-6">
        <Button size="lg" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button size="lg" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : form.isPublished ? "Save and publish" : "Save as draft"}
        </Button>
      </div>
    </Card>
  );
}
