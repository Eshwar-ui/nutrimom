"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import {
  DONATION_STATUS_LABELS,
  DONATION_STATUS_TRANSITIONS,
  HANDOVER_PREFERENCE_LABELS,
  conditionLabels,
  whatsappLink,
  type DonationOffer,
  type DonationStatus,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { Card, Label, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { ListingThumb } from "@/components/ui/listing-thumb";
import { DonationStatusChip } from "@/components/donation-status-chip";

/** Button wording for each move, phrased as what the admin has just done. */
const MOVE_LABELS: Record<DonationStatus, string> = {
  NEW: "Back to new",
  CONTACTED: "Mark contacted",
  MATCHED: "Mark matched",
  COMPLETED: "Mark handed over",
  DECLINED: "Decline",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AdminDonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: donation, isLoading, error } = useQuery({
    queryKey: ["admin-donation", id],
    queryFn: () => authedRequest<DonationOffer>(`/admin/donations/${id}`),
    retry: false,
  });

  // null = untouched, so the field shows the saved note until the admin edits it.
  const [draft, setDraft] = useState<string | null>(null);
  const note = draft ?? donation?.adminNote ?? "";

  const update = useMutation({
    mutationFn: (body: { status: DonationStatus; adminNote: string }) =>
      authedRequest<DonationOffer>(`/admin/donations/${id}`, { method: "PATCH", body }),
    onSuccess: (updated, vars) => {
      qc.setQueryData(["admin-donation", id], updated);
      qc.invalidateQueries({ queryKey: ["admin-donations"] });
      setDraft(null);
      toast.success(
        vars.status === donation?.status ? "Note saved" : `Marked ${DONATION_STATUS_LABELS[vars.status].toLowerCase()}`,
      );
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update this donation"),
  });

  if (isLoading) return <PageSkeleton rows={4} />;
  if (error || !donation) {
    return (
      <StatePanel
        tone="error"
        title="Donation not found"
        description="It may have been removed, or the link might be wrong."
        action={<Link href="/admin/donations" className="text-sm underline">Back to donations</Link>}
      />
    );
  }

  const moves = DONATION_STATUS_TRANSITIONS[donation.status];
  const terminal = moves.length === 0;
  const phone = donation.contactPhone;
  const firstName = donation.contactName.split(" ")[0];
  const facts: [string, string][] = [
    ["Category", donation.category?.name ?? "Not specified"],
    ["Condition", conditionLabels[donation.condition]],
    ["Handover", HANDOVER_PREFERENCE_LABELS[donation.handover]],
    ["Location", [donation.city, donation.locality].filter(Boolean).join(" · ")],
    ["PIN code", donation.pincode],
    ["Submitted", fmt(donation.createdAt)],
  ];

  return (
    <div>
      <Link href="/admin/donations" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to donations
      </Link>

      <header className="mb-7 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Donation</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Offer from {donation.contactName}
          </h1>
        </div>
        <DonationStatusChip status={donation.status} className="px-3 py-1 text-xs" />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-semibold text-foreground">The item</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">{donation.itemsDescription}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border bg-surface p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-semibold text-foreground">Photos</h2>
            {donation.images.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No photos were added — ask {firstName} for some when you call.</p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {donation.images.map((src, i) => (
                  <li key={src} className="aspect-square overflow-hidden rounded-2xl bg-muted">
                    <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1} full size`}>
                      <ListingThumb src={src} alt={`Donated item, photo ${i + 1}`} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-semibold text-foreground">Contact</h2>
            <p className="mt-1 text-xs text-muted-foreground">As given on the offer — her profile may have changed since.</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2 text-foreground">
                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" /> {donation.contactName}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a href={`mailto:${donation.contactEmail}`} className="break-all text-foreground underline-offset-2 hover:underline">
                  {donation.contactEmail}
                </a>
              </li>
              {phone ? (
                <>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-foreground underline-offset-2 hover:underline">
                      {phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={whatsappLink(phone, `Hi ${firstName}, this is The Nurture Moms team about the item you offered to donate.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline-offset-2 hover:underline"
                    >
                      Message on WhatsApp
                    </a>
                  </li>
                </>
              ) : (
                <li className="text-muted-foreground">No phone on file (the account was deleted).</li>
              )}
            </ul>
            <Link
              href={`/admin/users/${donation.donorId}`}
              className="mt-4 inline-flex text-sm font-semibold text-accent-text hover:underline"
            >
              View donor account
            </Link>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-semibold text-foreground">Progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {terminal
                ? `This donation is ${DONATION_STATUS_LABELS[donation.status].toLowerCase()} — its status can't change any more. You can still edit the note.`
                : "New → Contacted → Matched → Completed. Decline at any step if it can't be passed on."}
            </p>

            <div className="mt-4">
              <Label htmlFor="donation-note">Admin note</Label>
              <Textarea
                id="donation-note"
                rows={4}
                maxLength={1000}
                value={note}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Called her — pickup Saturday morning. Matched with Priya (Whitefield)."
              />
              <p className="mt-1 text-xs text-muted-foreground">Only admins see this. It&apos;s saved with any status change too.</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {moves.map((next) => (
                <Button
                  key={next}
                  variant={next === "DECLINED" ? "outline" : "primary"}
                  size="sm"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ status: next, adminNote: note })}
                >
                  {MOVE_LABELS[next]}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={update.isPending || draft === null || note === (donation.adminNote ?? "")}
                onClick={() => update.mutate({ status: donation.status, adminNote: note })}
              >
                Save note
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Last updated {fmt(donation.updatedAt)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
