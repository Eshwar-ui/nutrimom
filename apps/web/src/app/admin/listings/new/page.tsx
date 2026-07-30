"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Camera, CircleDollarSign, PackageOpen } from "lucide-react";
import { conditionLabels, deliveryLabels, listingInputSchema, type Category } from "@nutrimom/shared";
import { getCategories } from "@/lib/listings";
import { authedRequest, ApiError } from "@/lib/api";
import { Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/image-uploader";

/**
 * Admin-authored listing (roadmap 4.1) — same shape as the seller's own
 * /sell form, minus a personal WhatsApp field (there's no individual seller
 * to attach it to; it's owned by the built-in Marketplace account). Posts
 * to /admin/listings, which auto-approves — an admin creating it *is* the
 * review.
 */
export default function AdminNewListingPage() {
  const router = useRouter();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    condition: "GOOD",
    description: "",
    originalRupees: "",
    sellingRupees: "",
    city: "",
    deliveryOption: "PICKUP",
    usageDuration: "",
    reasonForSelling: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      condition: form.condition,
      originalPriceInPaise: form.originalRupees ? Math.round(parseFloat(form.originalRupees) * 100) : undefined,
      sellingPriceInPaise: form.sellingRupees ? Math.round(parseFloat(form.sellingRupees) * 100) : NaN,
      city: form.city,
      deliveryOption: form.deliveryOption,
      usageDuration: form.usageDuration || undefined,
      reasonForSelling: form.reasonForSelling || undefined,
      images,
    };
    const parsed = listingInputSchema.safeParse(payload);
    if (!parsed.success) {
      const nextIssues: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextIssues[String(issue.path[0] ?? "form")] ??= issue.message;
      setIssues(nextIssues);
      setError("Check the highlighted details before submitting.");
      return;
    }
    setIssues({});
    setBusy(true);
    try {
      await authedRequest("/admin/listings", { method: "POST", body: parsed.data });
      router.push("/admin/listings");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not create this listing");
      setBusy(false);
    }
  };

  const describedBy = (name: string, helper?: string) => [helper, issues[name] ? `${name}-error` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">New listing</h1>
        <p className="mt-2 text-muted-foreground">Created under the Marketplace account and published immediately.</p>
      </header>

      <Card className="overflow-hidden">
        <fieldset className="grid gap-5 border-b border-border p-6 sm:p-8">
          <legend className="sr-only">Photos</legend>
          <SectionHeading icon={Camera} title="Photos" description="Add clear photos of the exact item from several angles." />
          <ImageUploader onChange={setImages} error={issues.images} />
        </fieldset>

        <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
          <legend className="sr-only">Item details</legend>
          <div className="sm:col-span-2"><SectionHeading icon={PackageOpen} title="Item details" description="Describe condition honestly so buyers know exactly what to expect." /></div>
          <Field label="What are you selling?" id="title" error={issues.title} className="sm:col-span-2">
            <Input id="title" value={form.title} onChange={(event) => set("title", event.target.value)} aria-invalid={!!issues.title} aria-describedby={describedBy("title")} placeholder="Chicco Bravo Stroller - Navy" />
          </Field>
          <Field label="Description" id="description" error={issues.description} className="sm:col-span-2">
            <Textarea id="description" value={form.description} onChange={(event) => set("description", event.target.value)} rows={5} aria-invalid={!!issues.description} aria-describedby={describedBy("description")} placeholder="Condition, what is included, and any visible wear..." />
          </Field>
          <Field label="Category" id="categoryId" error={issues.categoryId}>
            <CustomSelect
              id="categoryId"
              value={form.categoryId}
              onChange={(value) => set("categoryId", value)}
              options={(categories ?? []).map((category: Category) => ({ value: category.id, label: category.name }))}
              placeholder="Select a category"
              invalid={!!issues.categoryId}
              describedBy={describedBy("categoryId")}
            />
          </Field>
          <Field label="Condition" id="condition" error={issues.condition}>
            <CustomSelect
              id="condition"
              value={form.condition}
              onChange={(value) => set("condition", value)}
              options={Object.entries(conditionLabels).map(([value, label]) => ({ value, label }))}
              invalid={!!issues.condition}
            />
          </Field>
          <Field label="Used for" id="usageDuration" helper="Optional">
            <Input id="usageDuration" value={form.usageDuration} onChange={(event) => set("usageDuration", event.target.value)} placeholder="8 months" />
          </Field>
          <Field label="Reason for selling" id="reasonForSelling" helper="Optional">
            <Input id="reasonForSelling" value={form.reasonForSelling} onChange={(event) => set("reasonForSelling", event.target.value)} placeholder="Excess inventory" />
          </Field>
        </fieldset>

        <fieldset className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
          <legend className="sr-only">Price and handover</legend>
          <div className="sm:col-span-2"><SectionHeading icon={CircleDollarSign} title="Price and handover" description="Set the price, location and best way for the buyer to receive it." /></div>
          <Field label="Original price" id="originalRupees" helper="Optional, in Rs." error={issues.originalPriceInPaise}>
            <Input id="originalRupees" type="number" min="1" value={form.originalRupees} onChange={(event) => set("originalRupees", event.target.value)} aria-invalid={!!issues.originalPriceInPaise} />
          </Field>
          <Field label="Selling price" id="sellingRupees" helper="In Rs." error={issues.sellingPriceInPaise}>
            <Input id="sellingRupees" type="number" min="1" value={form.sellingRupees} onChange={(event) => set("sellingRupees", event.target.value)} aria-invalid={!!issues.sellingPriceInPaise} />
          </Field>
          <Field label="City" id="city" error={issues.city}>
            <Input id="city" value={form.city} onChange={(event) => set("city", event.target.value)} autoComplete="address-level2" aria-invalid={!!issues.city} placeholder="Bengaluru" />
          </Field>
          <Field label="Delivery" id="deliveryOption" error={issues.deliveryOption}>
            <CustomSelect
              id="deliveryOption"
              value={form.deliveryOption}
              onChange={(value) => set("deliveryOption", value)}
              options={Object.entries(deliveryLabels).map(([value, label]) => ({ value, label }))}
              invalid={!!issues.deliveryOption}
            />
          </Field>
        </fieldset>

        {error && <p role="alert" className="mx-6 mt-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger sm:mx-8">{error}</p>}
        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:p-6">
          <Button size="lg" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button size="lg" onClick={submit} disabled={busy}>{busy ? "Publishing..." : "Publish listing"}</Button>
        </div>
      </Card>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Camera; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-foreground">{title}</h2><p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p></div></div>;
}

function Field({ label, id, helper, error, className, children }: { label: string; id: string; helper?: string; error?: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><div className="flex items-center justify-between gap-3"><Label htmlFor={id}>{label}</Label>{helper && <span className="mb-1.5 text-xs text-muted-foreground">{helper}</span>}</div>{children}{error && <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">{error}</p>}</div>;
}
