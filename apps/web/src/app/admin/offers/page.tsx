"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgePercent, ExternalLink, Eye, EyeOff, Pencil, Plus, Store, Trash2 } from "lucide-react";
import {
  partnerOfferInputSchema,
  type PartnerOffer,
  type PartnerOfferInput,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { revalidatePublicPages } from "@/lib/revalidate";
import {
  apiIssues,
  errorMessage,
  formatDateTime,
  isPast,
  isoToLocalInput,
  localInputToIso,
  optionalInt,
  zodIssues,
  type FormIssues,
} from "@/lib/admin-content";
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
  FormWarning,
  SectionHeading,
  StatusChip,
} from "@/components/admin-form";
import { AdminImageField } from "@/components/admin-image-field";
import { cn } from "@/lib/utils";

const QUERY_KEY = ["admin-partner-offers"];

function offerToInput(offer: PartnerOffer): PartnerOfferInput {
  return {
    brandName: offer.brandName,
    logoUrl: offer.logoUrl,
    description: offer.description,
    benefit: offer.benefit,
    couponCode: offer.couponCode,
    url: offer.url,
    isAffiliate: offer.isAffiliate,
    expiresAt: offer.expiresAt,
    isActive: offer.isActive,
    sortOrder: offer.sortOrder,
  };
}

type Editing = { offer?: PartnerOffer } | null;

export default function AdminOffersPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => authedRequest<PartnerOffer[]>("/admin/offers"),
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<PartnerOffer | null>(null);

  // The editor replaces the list in place; without this it opens wherever the
  // list happened to be scrolled, often half-way down the form.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [editing]);

  const afterChange = () => {
    void qc.invalidateQueries({ queryKey: QUERY_KEY });
    void revalidatePublicPages("offers");
  };

  const setActive = useMutation({
    mutationFn: (offer: PartnerOffer) =>
      authedRequest<PartnerOffer>(`/admin/offers/${offer.id}`, {
        method: "PUT",
        body: { ...offerToInput(offer), isActive: !offer.isActive },
      }),
    onSuccess: (offer) => {
      afterChange();
      toast.success(offer.isActive ? `${offer.brandName} is live` : `${offer.brandName} is hidden`);
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't update this offer")),
  });

  const remove = useMutation({
    mutationFn: (offer: PartnerOffer) => authedRequest(`/admin/offers/${offer.id}`, { method: "DELETE" }),
    onSuccess: () => {
      afterChange();
      setDeleting(null);
      toast.success("Offer deleted");
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't delete this offer")),
  });

  if (editing) {
    return (
      <div>
        <AdminPageHeader
          eyebrow="Offers"
          title={editing.offer ? `Edit ${editing.offer.brandName}` : "New partner offer"}
          description="Only add a benefit you have verified with the brand. Expired offers disappear from the site automatically."
        />
        <OfferEditor
          initial={editing.offer}
          onCancel={() => setEditing(null)}
          onSaved={(offer) => {
            afterChange();
            toast.success(editing.offer ? "Offer saved" : `${offer.brandName} added`);
            setEditing(null);
          }}
        />
      </div>
    );
  }

  const offers = data ?? [];
  const now = new Date();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Partner offers"
        description="Discounts from partner brands on the Exclusive Offers page. Expired offers stay listed here, marked, but never show on the site."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> New offer
          </Button>
        }
      />

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : isError ? (
        <StatePanel
          tone="error"
          title="Couldn't load the offers"
          description="Check your connection and try again."
          action={<Button variant="outline" onClick={() => void refetch()}>Try again</Button>}
        />
      ) : offers.length === 0 ? (
        <StatePanel
          icon={BadgePercent}
          title="No partner offers yet"
          description="The offers page stays hidden until the first offer is added."
          action={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New offer</Button>}
        />
      ) : (
        <Card className="divide-y divide-border">
          {offers.map((offer) => {
            const expired = isPast(offer.expiresAt, now);
            return (
              <div key={offer.id} className={cn("flex flex-wrap items-center gap-4 p-4", expired && "bg-muted/40")}>
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface">
                  {offer.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an uploaded URL
                    <img src={offer.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Store className="h-5 w-5 text-muted-foreground" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    <button type="button" onClick={() => setEditing({ offer })} className="truncate text-left hover:text-accent-text">
                      {offer.brandName}
                    </button>
                    {expired && <StatusChip tone="danger">Expired</StatusChip>}
                    {!offer.isActive && <StatusChip>Hidden</StatusChip>}
                    {offer.isAffiliate && <StatusChip tone="gold">Affiliate</StatusChip>}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {offer.benefit}
                    {offer.couponCode && <> · code <span className="font-mono font-semibold text-foreground">{offer.couponCode}</span></>}
                  </p>
                  <p className={cn("mt-0.5 text-xs", expired ? "font-semibold text-danger" : "text-muted-foreground")}>
                    {offer.expiresAt
                      ? `${expired ? "Expired" : "Expires"} ${formatDateTime(offer.expiresAt)}`
                      : "No expiry date"}
                    {" · "}order {offer.sortOrder}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${offer.brandName}'s link`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={offer.isActive ? `Hide ${offer.brandName}` : `Show ${offer.brandName}`}
                    title={offer.isActive ? "Hide from the site" : "Show on the site"}
                    disabled={setActive.isPending && setActive.variables?.id === offer.id}
                    onClick={() => setActive.mutate(offer)}
                  >
                    {offer.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Edit ${offer.brandName}`} onClick={() => setEditing({ offer })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${offer.brandName}`} className="hover:text-danger" onClick={() => setDeleting(offer)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title={`Delete the ${deleting.brandName} offer?`}
          description="It disappears from the offers page straight away. This can't be undone."
          pending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting)}
        />
      )}
    </div>
  );
}

function OfferEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: PartnerOffer;
  onCancel: () => void;
  onSaved: (offer: PartnerOffer) => void;
}) {
  const [form, setForm] = useState({
    brandName: initial?.brandName ?? "",
    logoUrl: initial?.logoUrl ?? "",
    description: initial?.description ?? "",
    benefit: initial?.benefit ?? "",
    couponCode: initial?.couponCode ?? "",
    url: initial?.url ?? "",
    isAffiliate: initial?.isAffiliate ?? false,
    expiresAt: isoToLocalInput(initial?.expiresAt),
    isActive: initial?.isActive ?? true,
    sortOrder: initial?.sortOrder?.toString() ?? "0",
  });
  const [issues, setIssues] = useState<FormIssues>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const expiresIso = localInputToIso(form.expiresAt);
  const alreadyExpired = isPast(expiresIso);

  const submit = async () => {
    setError(null);
    const sortOrder = optionalInt(form.sortOrder) ?? 0;
    const parsed = partnerOfferInputSchema.safeParse({ ...form, expiresAt: expiresIso, sortOrder });
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
        ? await authedRequest<PartnerOffer>(`/admin/offers/${initial.id}`, { method: "PUT", body: parsed.data })
        : await authedRequest<PartnerOffer>("/admin/offers", { method: "POST", body: parsed.data });
      onSaved(saved);
    } catch (err) {
      setIssues(apiIssues(err));
      setError(errorMessage(err, "Couldn't save this offer"));
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-3xl overflow-hidden">
      <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Brand</legend>
        <div className="sm:col-span-2">
          <SectionHeading icon={Store} title="Brand" />
        </div>
        <Field label="Brand name" id="offer-brand" error={issues.brandName}>
          <Input id="offer-brand" value={form.brandName} maxLength={80} aria-invalid={!!issues.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Little Sprouts" />
        </Field>
        <Field label="Shop link" id="offer-url" error={issues.url} helper="Must start with https://">
          <Input id="offer-url" type="url" value={form.url} aria-invalid={!!issues.url} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com" />
        </Field>
        <Field label="Logo" id="offer-logo" error={issues.logoUrl} className="sm:col-span-2">
          <AdminImageField id="offer-logo" value={form.logoUrl} onChange={(url) => set("logoUrl", url)} aspect="square" fit="contain" />
        </Field>
        <Field label="Description" id="offer-description" error={issues.description} className="sm:col-span-2">
          <Textarea id="offer-description" rows={3} maxLength={500} value={form.description} aria-invalid={!!issues.description} onChange={(e) => set("description", e.target.value)} placeholder="Organic, freshly made baby food delivered weekly across Hyderabad." />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">The offer</legend>
        <div className="sm:col-span-2">
          <SectionHeading icon={BadgePercent} title="The offer" description="State only what the brand has confirmed." />
        </div>
        <Field label="Verified benefit" id="offer-benefit" error={issues.benefit}>
          <Input id="offer-benefit" value={form.benefit} maxLength={120} aria-invalid={!!issues.benefit} onChange={(e) => set("benefit", e.target.value)} placeholder="15% off your first order" />
        </Field>
        <Field label="Coupon code" id="offer-code" error={issues.couponCode} helper="Optional — mothers get a Copy button.">
          <Input id="offer-code" value={form.couponCode} maxLength={40} aria-invalid={!!issues.couponCode} onChange={(e) => set("couponCode", e.target.value.toUpperCase())} placeholder="NURTURE15" className="font-mono" />
        </Field>
        <Field label="Expires" id="offer-expires" error={issues.expiresAt} helper="Your local time. Blank means no expiry." className="sm:col-span-2">
          <Input id="offer-expires" type="datetime-local" value={form.expiresAt} aria-invalid={!!issues.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className="max-w-xs" />
        </Field>
        {alreadyExpired && (
          <div className="sm:col-span-2">
            <FormWarning>This date has passed, so the offer won&apos;t show on the site. Set a later date to bring it back.</FormWarning>
          </div>
        )}
        <div className="sm:col-span-2">
          <CheckboxField
            id="offer-affiliate"
            checked={form.isAffiliate}
            onChange={(v) => set("isAffiliate", v)}
            label="Affiliate link"
            description="We may earn a commission. The card shows an “Affiliate link” chip and the link is marked sponsored."
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Display</legend>
        <CheckboxField id="offer-active" checked={form.isActive} onChange={(v) => set("isActive", v)} label="Show on the site" description="Untick to keep it as a draft." />
        <Field label="Sort order" id="offer-sort" error={issues.sortOrder} helper="Lower numbers come first.">
          <Input id="offer-sort" inputMode="numeric" value={form.sortOrder} aria-invalid={!!issues.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="max-w-[8rem]" />
        </Field>
      </fieldset>

      {error && (
        <div className="px-6 pb-6 sm:px-8">
          <FormAlert message={error} />
        </div>
      )}
      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:p-6">
        <Button size="lg" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button size="lg" onClick={submit} disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add offer"}</Button>
      </div>
    </Card>
  );
}
