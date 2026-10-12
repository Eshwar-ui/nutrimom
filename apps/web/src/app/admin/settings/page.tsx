"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import {
  businessFieldLabels,
  formatBps,
  formatPaise,
  isBusinessProfileComplete,
  missingBusinessFields,
  splitPayout,
  type BusinessProfile,
  type BusinessProfileInput,
  type CancellationPolicy,
  type CancellationPolicyInput,
  type PayoutPolicy,
} from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import {
  getBusinessProfileAdmin,
  getPayoutPolicy,
  updateBusinessProfile,
  updatePayoutPolicy,
} from "@/lib/payouts";
import { revalidatePublicPages } from "@/lib/revalidate";
import { toast } from "@/lib/toast-store";
import { Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
  const { data: policy, isLoading } = useQuery({
    queryKey: ["cancellation-policy"],
    queryFn: () => authedRequest<CancellationPolicy>("/cancellation-policy"),
  });
  const { data: payoutPolicy, isLoading: payoutLoading } = useQuery({
    queryKey: ["payout-policy"],
    queryFn: getPayoutPolicy,
  });
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["business-profile"],
    queryFn: getBusinessProfileAdmin,
  });

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Marketplace policy</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">Cancellation rules, and the commission the marketplace keeps on each sale.</p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Cancellations</h2>
          {isLoading || !policy ? (
            <PageSkeleton rows={3} />
          ) : (
            <CancellationPolicyForm key={policy.updatedAt} policy={policy} />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Commission</h2>
          {payoutLoading || !payoutPolicy ? (
            <PageSkeleton rows={2} />
          ) : (
            <PayoutPolicyForm key={payoutPolicy.updatedAt} policy={payoutPolicy} />
          )}
        </section>

        <section>
          <h2 className="mb-1 text-lg font-semibold text-foreground">Business &amp; grievance details</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Required on the legal pages by Indian e-commerce rules. Until every field below is
            filled in, Terms, Privacy, Refunds and Contact stay unindexed and show a draft banner.
          </p>
          {businessLoading || !business ? (
            <PageSkeleton rows={4} />
          ) : (
            <BusinessProfileForm key={business.updatedAt} profile={business} />
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * The gate on publishing the legal pages. It's all-or-nothing on purpose:
 * a policy page naming a grievance officer but no registered address is not
 * a compliant page, so partial completion must not flip it live.
 */
function BusinessProfileForm({ profile }: { profile: BusinessProfile }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BusinessProfileInput>({
    legalEntityName: profile.legalEntityName,
    tradeName: profile.tradeName,
    registeredAddress: profile.registeredAddress,
    supportEmail: profile.supportEmail,
    supportPhone: profile.supportPhone,
    grievanceOfficerName: profile.grievanceOfficerName,
    grievanceOfficerEmail: profile.grievanceOfficerEmail,
    gstin: profile.gstin ?? "",
    cin: profile.cin ?? "",
  });

  const save = useMutation({
    mutationFn: () => updateBusinessProfile(form),
    onSuccess: (updated) => {
      qc.setQueryData(["business-profile"], updated);
      // The legal pages read this profile server-side behind a 60s cache, so
      // without a purge the operator saves their details and the pages still
      // say "pre-launch draft" for up to a minute — and the same delay applies
      // to blanking a field, which should un-publish them just as promptly.
      void revalidatePublicPages("legal");
      toast.success(
        isBusinessProfileComplete(updated)
          ? "Saved — the legal pages are now live and indexable"
          : "Saved — the legal pages stay unindexed until every field is filled",
      );
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save the details"),
  });

  const set = (key: keyof BusinessProfileInput) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const missing = missingBusinessFields({ ...profile, ...form });
  const dirty = (Object.keys(form) as (keyof BusinessProfileInput)[]).some(
    (k) => (form[k] ?? "") !== (profile[k] ?? ""),
  );

  const fields: { key: keyof BusinessProfileInput; label: string; hint?: string; textarea?: boolean }[] = [
    { key: "legalEntityName", label: "Registered legal entity name", hint: "As it appears on your GST / incorporation documents." },
    { key: "tradeName", label: "Trading name", hint: "The name customers know you by." },
    { key: "registeredAddress", label: "Registered address", textarea: true },
    { key: "supportEmail", label: "Support email" },
    { key: "supportPhone", label: "Support phone" },
    { key: "grievanceOfficerName", label: "Grievance officer name" },
    { key: "grievanceOfficerEmail", label: "Grievance officer email" },
    { key: "gstin", label: "GSTIN (optional)" },
    { key: "cin", label: "CIN (optional)" },
  ];

  return (
    <Card className="max-w-2xl space-y-5 p-6">
      <div
        className={cn(
          "rounded-xl border p-3 text-sm",
          missing.length === 0
            ? "border-primary/30 bg-primary/10 text-foreground"
            : "border-gold/40 bg-gold/10 text-foreground",
        )}
      >
        {missing.length === 0 ? (
          <span className="font-semibold">All set — the legal pages are published and indexable.</span>
        ) : (
          <>
            <span className="font-semibold">
              {missing.length} field{missing.length === 1 ? "" : "s"} still needed
            </span>{" "}
            before the legal pages can go live: {missing.map((m) => businessFieldLabels[m as keyof typeof businessFieldLabels]).join(", ")}.
          </>
        )}
      </div>

      {fields.map((f) => (
        <div key={f.key}>
          <Label htmlFor={`bp-${f.key}`}>{f.label}</Label>
          {f.textarea ? (
            <Textarea
              id={`bp-${f.key}`}
              rows={3}
              value={form[f.key] ?? ""}
              onChange={(e) => set(f.key)(e.target.value)}
              className="mt-1.5"
            />
          ) : (
            <Input
              id={`bp-${f.key}`}
              value={form[f.key] ?? ""}
              onChange={(e) => set(f.key)(e.target.value)}
              className="mt-1.5"
            />
          )}
          {f.hint && <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>}
        </div>
      ))}

      <div className="border-t border-border pt-5">
        <Button disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </Card>
  );
}

/**
 * The commission is stored in basis points so a rate like 5.5% needs no
 * floats. Editing it never moves money already earned — each payout snapshots
 * the rate that was in force when the sale settled.
 */
function PayoutPolicyForm({ policy }: { policy: PayoutPolicy }) {
  const qc = useQueryClient();
  const [percent, setPercent] = useState(policy.commissionBps / 100);

  const save = useMutation({
    mutationFn: () => updatePayoutPolicy({ commissionBps: Math.round(percent * 100) }),
    onSuccess: (updated) => {
      qc.setQueryData(["payout-policy"], updated);
      toast.success(`Commission set to ${formatBps(updated.commissionBps)}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save the commission"),
  });

  const valid = Number.isFinite(percent) && percent >= 0 && percent <= 100;
  const dirty = valid && Math.round(percent * 100) !== policy.commissionBps;
  // A worked example beats a percentage — it's the number the seller sees.
  const example = splitPayout(100000, valid ? Math.round(percent * 100) : policy.commissionBps);

  return (
    <Card className="max-w-2xl space-y-6 p-6">
      <div>
        <Label htmlFor="commission">Marketplace commission (%)</Label>
        <Input
          id="commission"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="mt-1.5 max-w-[10rem]"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Deducted from every sale before the seller is paid. On a{" "}
          {formatPaise(100000)} item the seller receives{" "}
          <span className="font-semibold text-foreground">{formatPaise(example.netInPaise)}</span> and
          the marketplace keeps {formatPaise(example.commissionInPaise)}.
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Changing this only affects future sales — payouts already recorded keep the rate they sold at.
        </p>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save commission"}
        </Button>
        {!valid && <p className="text-xs text-danger">Enter a percentage between 0 and 100.</p>}
      </div>
    </Card>
  );
}

// Keyed on policy.updatedAt by the parent (via `key`), so this component's
// local state is seeded fresh from props once — and again after a save
// changes updatedAt — without an effect syncing state to a query result.
function CancellationPolicyForm({ policy }: { policy: CancellationPolicy }) {
  const qc = useQueryClient();
  const [cutoffHours, setCutoffHours] = useState(policy.cutoffHours);
  const [refundPercentage, setRefundPercentage] = useState(policy.refundPercentage);
  const [conditionDisputeHours, setConditionDisputeHours] = useState(policy.conditionDisputeHours);
  const [reasonCodes, setReasonCodes] = useState<string[]>(policy.reasonCodes);
  const [newReason, setNewReason] = useState("");

  const save = useMutation({
    mutationFn: (dto: CancellationPolicyInput) =>
      authedRequest<CancellationPolicy>("/admin/cancellation-policy", { method: "PATCH", body: dto }),
    onSuccess: (updated) => {
      qc.setQueryData(["cancellation-policy"], updated);
      // /refunds publishes the live cutoff window and refund percentage, so a
      // policy change has to reach it now — a published promise that lags
      // behind what OrdersService.cancel actually enforces is the one thing
      // that page must never do.
      void revalidatePublicPages("legal");
      toast.success("Cancellation policy updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save the policy"),
  });

  const addReason = () => {
    const trimmed = newReason.trim();
    if (!trimmed || reasonCodes.includes(trimmed)) return;
    setReasonCodes([...reasonCodes, trimmed]);
    setNewReason("");
  };

  const dirty =
    cutoffHours !== policy.cutoffHours ||
    refundPercentage !== policy.refundPercentage ||
    conditionDisputeHours !== policy.conditionDisputeHours ||
    JSON.stringify(reasonCodes) !== JSON.stringify(policy.reasonCodes);

  return (
    <Card className="max-w-2xl space-y-6 p-6">
      <div>
        <Label htmlFor="cutoff-hours">Cancellation window (hours after placing)</Label>
        <Input
          id="cutoff-hours"
          type="number"
          min={1}
          max={24 * 90}
          value={cutoffHours}
          onChange={(e) => setCutoffHours(Number(e.target.value))}
          className="mt-1.5 max-w-[10rem]"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Orders can only be self-cancelled by the buyer within this many hours of being placed.
        </p>
      </div>

      <div>
        <Label htmlFor="refund-percentage">Refund on cancellation (%)</Label>
        <Input
          id="refund-percentage"
          type="number"
          min={0}
          max={100}
          value={refundPercentage}
          onChange={(e) => setRefundPercentage(Number(e.target.value))}
          className="mt-1.5 max-w-[10rem]"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Portion of the payment refunded when a paid order is cancelled. 100 = full refund.
        </p>
      </div>

      <div>
        <Label htmlFor="condition-dispute-hours">Condition dispute window (hours after delivery)</Label>
        <Input
          id="condition-dispute-hours"
          type="number"
          min={1}
          max={24 * 90}
          value={conditionDisputeHours}
          onChange={(e) => setConditionDisputeHours(Number(e.target.value))}
          className="mt-1.5 max-w-[10rem]"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          How long a buyer has to report that an item arrived &quot;not as described&quot;. This is
          published on the <a href="/refunds" className="font-medium text-accent-text hover:underline">refund policy page</a> —
          it is a promise to buyers, not yet enforced in code, since there is no dispute-raising flow.
        </p>
      </div>

      <div>
        <Label>Cancellation reasons</Label>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          Shown to buyers and admins when cancelling — at least one is required.
        </p>
        <div className="flex flex-wrap gap-2">
          {reasonCodes.map((reason) => (
            <span
              key={reason}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground"
            >
              {reason}
              <button
                type="button"
                aria-label={`Remove reason "${reason}"`}
                onClick={() => setReasonCodes(reasonCodes.filter((r) => r !== reason))}
                className="text-muted-foreground hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addReason();
              }
            }}
            placeholder="Add a reason…"
            maxLength={80}
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addReason}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button
          disabled={!dirty || reasonCodes.length === 0 || save.isPending}
          onClick={() =>
            save.mutate({ cutoffHours, refundPercentage, conditionDisputeHours, reasonCodes })
          }
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        {reasonCodes.length === 0 && (
          <p className="text-xs text-danger">At least one cancellation reason is required.</p>
        )}
      </div>
    </Card>
  );
}
