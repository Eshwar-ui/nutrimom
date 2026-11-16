"use client";

import { useState } from "react";
import { BadgePercent, CalendarClock, FileText, IndianRupee, ListChecks } from "lucide-react";
import {
  DEFAULT_OFFER_LABEL,
  SERVICE_GROUP_LABELS,
  SESSION_FORMAT_LABELS,
  offerSavingsWarning,
  servicePackageInputSchema,
  type ServiceGroup,
  type ServicePackage,
  type ServicePackageInput,
  type SessionFormat,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import {
  apiIssues,
  errorMessage,
  formatDateTime,
  isPast,
  isoToLocalInput,
  localInputToIso,
  optionalInt,
  paiseToRupees,
  rupeesToPaise,
  zodIssues,
  type FormIssues,
} from "@/lib/admin-content";
import { Card, Input, Select, Textarea } from "@/components/ui/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  CheckboxField,
  Field,
  FormAlert,
  FormWarning,
  SectionHeading,
  StringListEditor,
} from "@/components/admin-form";
import { ServicePackageCard } from "@/components/service-package-card";

/** A stored package back into the full-replace input the API expects. */
export function packageToInput(pkg: ServicePackage): ServicePackageInput {
  return {
    group: pkg.group,
    name: pkg.name,
    summary: pkg.summary,
    includes: pkg.includes,
    sessionCount: pkg.sessionCount,
    sessionMinutes: pkg.sessionMinutes,
    validityDays: pkg.validityDays,
    format: pkg.format,
    pricePaise: pkg.pricePaise,
    offerPricePaise: pkg.offerPricePaise,
    offerLabel: pkg.offerLabel,
    offerEndsAt: pkg.offerEndsAt,
    isIntroductory: pkg.isIntroductory,
    isBestValue: pkg.isBestValue,
    isActive: pkg.isActive,
    sortOrder: pkg.sortOrder,
  };
}

const GROUPS = Object.keys(SERVICE_GROUP_LABELS) as ServiceGroup[];
const FORMATS = Object.keys(SESSION_FORMAT_LABELS) as SessionFormat[];

interface FormState {
  group: ServiceGroup;
  name: string;
  summary: string;
  includes: string[];
  sessionCount: string;
  sessionMinutes: string;
  validityDays: string;
  format: SessionFormat;
  price: string;
  offerPrice: string;
  offerLabel: string;
  offerEndsAt: string; // datetime-local, local time
  isIntroductory: boolean;
  isBestValue: boolean;
  isActive: boolean;
  sortOrder: string;
}

function initialState(pkg: ServicePackage | undefined, group: ServiceGroup | undefined): FormState {
  return {
    group: pkg?.group ?? group ?? "PRENATAL_YOGA",
    name: pkg?.name ?? "",
    summary: pkg?.summary ?? "",
    includes: pkg?.includes ?? [],
    sessionCount: pkg?.sessionCount?.toString() ?? "",
    sessionMinutes: pkg?.sessionMinutes?.toString() ?? "",
    validityDays: pkg?.validityDays?.toString() ?? "",
    format: pkg?.format ?? "LIVE_GROUP",
    price: paiseToRupees(pkg?.pricePaise),
    offerPrice: paiseToRupees(pkg?.offerPricePaise),
    offerLabel: pkg?.offerLabel ?? "",
    offerEndsAt: isoToLocalInput(pkg?.offerEndsAt),
    isIntroductory: pkg?.isIntroductory ?? false,
    isBestValue: pkg?.isBestValue ?? false,
    isActive: pkg?.isActive ?? true,
    sortOrder: pkg?.sortOrder?.toString() ?? "0",
  };
}

/** Numbers typed into text inputs; NaN means "not a number" and is reported. */
const NUMBER_FIELDS: { key: keyof ServicePackageInput; message: string }[] = [
  { key: "sessionCount", message: "Enter the number of sessions" },
  { key: "sessionMinutes", message: "Enter the duration in minutes" },
  { key: "validityDays", message: "Enter validity in days" },
  { key: "pricePaise", message: "Enter the price in rupees, e.g. 1499" },
  { key: "offerPricePaise", message: "Enter the offer price in rupees" },
  { key: "sortOrder", message: "Enter a whole number" },
];

function toPayload(form: FormState) {
  return {
    group: form.group,
    name: form.name,
    summary: form.summary,
    includes: form.includes,
    sessionCount: optionalInt(form.sessionCount),
    sessionMinutes: optionalInt(form.sessionMinutes),
    validityDays: optionalInt(form.validityDays),
    format: form.format,
    pricePaise: rupeesToPaise(form.price),
    offerPricePaise: rupeesToPaise(form.offerPrice),
    offerLabel: form.offerLabel,
    offerEndsAt: localInputToIso(form.offerEndsAt),
    isIntroductory: form.isIntroductory,
    isBestValue: form.isBestValue,
    isActive: form.isActive,
    sortOrder: optionalInt(form.sortOrder) ?? 0,
  };
}

export function ServicePackageEditor({
  initial,
  defaultGroup,
  onCancel,
  onSaved,
}: {
  initial?: ServicePackage;
  defaultGroup?: ServiceGroup;
  onCancel: () => void;
  onSaved: (pkg: ServicePackage) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(initial, defaultGroup));
  const [issues, setIssues] = useState<FormIssues>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const payload = toPayload(form);
  const now = new Date();

  // The preview renders whatever is typed, valid or not — blank prices read as
  // ₹0 rather than hiding the card while the admin is mid-edit.
  const pricePaise = Number.isFinite(payload.pricePaise) ? (payload.pricePaise ?? 0) : 0;
  const offerPricePaise =
    payload.offerPricePaise != null && Number.isFinite(payload.offerPricePaise) ? payload.offerPricePaise : null;
  const draft = {
    ...payload,
    pricePaise,
    offerPricePaise,
    offerLabel: form.offerLabel || null,
    offerEndsAt: payload.offerEndsAt || null,
    sessionCount: Number.isFinite(payload.sessionCount) ? payload.sessionCount : null,
    sessionMinutes: Number.isFinite(payload.sessionMinutes) ? payload.sessionMinutes : null,
    validityDays: Number.isFinite(payload.validityDays) ? payload.validityDays : null,
    includes: form.includes.filter((i) => i.trim()),
  };

  // The service bumps priceSince whenever the regular price changes, so the
  // warning has to judge against the date this save will produce.
  const priceSince =
    initial && initial.pricePaise === pricePaise ? initial.priceSince : now.toISOString();
  const savingsWarning = offerSavingsWarning({ ...draft, priceSince }, now);
  const offerEnded = offerPricePaise != null && isPast(draft.offerEndsAt, now);

  const submit = async () => {
    setError(null);
    const nextIssues: FormIssues = {};
    for (const { key, message } of NUMBER_FIELDS) {
      if (Number.isNaN(payload[key as keyof typeof payload])) nextIssues[key] = message;
    }
    if (payload.pricePaise === null) nextIssues.pricePaise = "Enter the regular price";
    const parsed = servicePackageInputSchema.safeParse(payload);
    if (!parsed.success || Object.keys(nextIssues).length > 0) {
      setIssues({ ...(parsed.success ? {} : zodIssues(parsed.error)), ...nextIssues });
      setError("Check the highlighted details before saving.");
      return;
    }
    setIssues({});
    setBusy(true);
    try {
      const saved = initial
        ? await authedRequest<ServicePackage>(`/admin/services/packages/${initial.id}`, { method: "PUT", body: parsed.data })
        : await authedRequest<ServicePackage>("/admin/services/packages", { method: "POST", body: parsed.data });
      onSaved(saved);
    } catch (err) {
      setIssues(apiIssues(err));
      setError(errorMessage(err, "Couldn't save this package"));
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="overflow-hidden">
        <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
          <legend className="sr-only">Package details</legend>
          <div className="sm:col-span-2">
            <SectionHeading icon={FileText} title="Package" description="Which service it belongs to and how it reads on the card." />
          </div>
          <Field label="Service" id="pkg-group" error={issues.group}>
            <Select id="pkg-group" value={form.group} onChange={(e) => set("group", e.target.value as ServiceGroup)}>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{SERVICE_GROUP_LABELS[g]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Format" id="pkg-format" error={issues.format}>
            <Select id="pkg-format" value={form.format} onChange={(e) => set("format", e.target.value as SessionFormat)}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>{SESSION_FORMAT_LABELS[f]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Name" id="pkg-name" error={issues.name} className="sm:col-span-2">
            <Input id="pkg-name" value={form.name} maxLength={80} aria-invalid={!!issues.name} onChange={(e) => set("name", e.target.value)} placeholder="Monthly Combo" />
          </Field>
          <Field label="Summary" id="pkg-summary" error={issues.summary} helper="One line under the name." className="sm:col-span-2">
            <Textarea id="pkg-summary" rows={2} value={form.summary} maxLength={300} aria-invalid={!!issues.summary} onChange={(e) => set("summary", e.target.value)} placeholder="8 Prenatal Yoga + 4 Garbhasanskar sessions" />
          </Field>
        </fieldset>

        <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-3 sm:p-8">
          <legend className="sr-only">Sessions</legend>
          <div className="sm:col-span-3">
            <SectionHeading icon={ListChecks} title="Sessions" description="Leave any of these blank until it's confirmed — the card simply leaves it out." />
          </div>
          <Field label="Number of sessions" id="pkg-count" error={issues.sessionCount}>
            <Input id="pkg-count" inputMode="numeric" value={form.sessionCount} aria-invalid={!!issues.sessionCount} onChange={(e) => set("sessionCount", e.target.value)} placeholder="12" />
          </Field>
          <Field label="Minutes per session" id="pkg-minutes" error={issues.sessionMinutes}>
            <Input id="pkg-minutes" inputMode="numeric" value={form.sessionMinutes} aria-invalid={!!issues.sessionMinutes} onChange={(e) => set("sessionMinutes", e.target.value)} placeholder="60" />
          </Field>
          <Field label="Valid for (days)" id="pkg-validity" error={issues.validityDays}>
            <Input id="pkg-validity" inputMode="numeric" value={form.validityDays} aria-invalid={!!issues.validityDays} onChange={(e) => set("validityDays", e.target.value)} placeholder="30" />
          </Field>
          <Field label="What's included" id="pkg-includes" error={issues.includes} helper="Bullet points on the card, in this order." className="sm:col-span-3">
            <StringListEditor id="pkg-includes" values={form.includes} onChange={(v) => set("includes", v)} placeholder="8 live Prenatal Yoga sessions" addLabel="Add point" max={12} maxLength={120} issues={issues} issuePrefix="includes" />
          </Field>
        </fieldset>

        <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
          <legend className="sr-only">Price</legend>
          <div className="sm:col-span-2">
            <SectionHeading icon={IndianRupee} title="Price" description="The regular price. Savings are worked out for you — never typed in." />
          </div>
          <Field label="Regular price (₹)" id="pkg-price" error={issues.pricePaise}>
            <Input id="pkg-price" inputMode="decimal" value={form.price} aria-invalid={!!issues.pricePaise} onChange={(e) => set("price", e.target.value)} placeholder="1499" />
          </Field>
          <Field
            label="Regular price set on"
            id="pkg-price-since"
            helper="Moves to today whenever the regular price changes."
          >
            <Input id="pkg-price-since" disabled readOnly value={initial && initial.pricePaise === pricePaise ? formatDateTime(initial.priceSince) : "Today, when you save"} />
          </Field>
          <div className="sm:col-span-2">
            <CheckboxField
              id="pkg-intro"
              checked={form.isIntroductory}
              onChange={(v) => set("isIntroductory", v)}
              label="Introductory price"
              description="Labels the price “Introductory Price”. Never shown with a strikethrough, so it can't be combined with an offer."
              error={issues.isIntroductory}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
          <legend className="sr-only">Offer</legend>
          <div className="sm:col-span-2">
            <SectionHeading icon={BadgePercent} title="Special offer" description="Optional. While it runs, the regular price is struck through. It disappears by itself after the end date." />
          </div>
          <Field label="Offer price (₹)" id="pkg-offer" error={issues.offerPricePaise} helper="Leave blank for no offer.">
            <Input id="pkg-offer" inputMode="decimal" value={form.offerPrice} aria-invalid={!!issues.offerPricePaise} onChange={(e) => set("offerPrice", e.target.value)} placeholder="1199" />
          </Field>
          <Field label="Offer label" id="pkg-offer-label" error={issues.offerLabel} helper={`Blank shows “${DEFAULT_OFFER_LABEL}”.`}>
            <Input id="pkg-offer-label" value={form.offerLabel} maxLength={40} aria-invalid={!!issues.offerLabel} onChange={(e) => set("offerLabel", e.target.value)} placeholder={DEFAULT_OFFER_LABEL} />
          </Field>
          <Field label="Offer ends" id="pkg-offer-ends" error={issues.offerEndsAt} helper="Your local time. Blank runs the offer until you remove it." className="sm:col-span-2">
            <Input id="pkg-offer-ends" type="datetime-local" value={form.offerEndsAt} aria-invalid={!!issues.offerEndsAt} onChange={(e) => set("offerEndsAt", e.target.value)} className="max-w-xs" />
          </Field>
        </fieldset>

        <fieldset className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
          <legend className="sr-only">Display</legend>
          <div className="sm:col-span-2">
            <SectionHeading icon={CalendarClock} title="Display" />
          </div>
          <CheckboxField id="pkg-best" checked={form.isBestValue} onChange={(v) => set("isBestValue", v)} label="Best value" description="Highlights the card with a border and a “Best value” badge." />
          <CheckboxField id="pkg-active" checked={form.isActive} onChange={(v) => set("isActive", v)} label="Show on the site" description="Untick to keep it as a draft." />
          <Field label="Sort order" id="pkg-sort" error={issues.sortOrder} helper="Lower numbers come first within the service.">
            <Input id="pkg-sort" inputMode="numeric" value={form.sortOrder} aria-invalid={!!issues.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="max-w-[8rem]" />
          </Field>
        </fieldset>

        {(error || issues.form) && (
          <div className="px-6 pb-6 sm:px-8">
            <FormAlert message={issues.form ?? error} />
          </div>
        )}
        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 p-5 backdrop-blur-xl sm:flex-row sm:justify-end sm:p-6">
          <Button size="lg" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button size="lg" onClick={submit} disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Create package"}</Button>
        </div>
      </Card>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Live preview">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Live preview</p>
        <ServicePackageCard
          pkg={draft}
          now={now}
          actions={
            <>
              {/* Inert stand-ins: the preview shows the buttons, it doesn't book. */}
              <span aria-hidden className={buttonVariants()}>Book Now</span>
              <span aria-hidden className={buttonVariants({ variant: "outline" })}>Enquire</span>
            </>
          }
        />
        {!form.isActive && <FormWarning>Hidden — this package won&apos;t appear on the site until “Show on the site” is ticked.</FormWarning>}
        {offerEnded && (
          <FormWarning>
            This offer has already ended, so the card shows the regular price. Set a later end date, or clear the offer.
          </FormWarning>
        )}
        {savingsWarning && <FormWarning>{savingsWarning}</FormWarning>}
      </aside>
    </div>
  );
}
