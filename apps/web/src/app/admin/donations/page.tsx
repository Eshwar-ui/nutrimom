"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Gift, X } from "lucide-react";
import {
  DONATION_STATUS_LABELS,
  DonationStatus,
  type DonationOffer,
  type DonationStatus as DonationStatusType,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { ListingThumb } from "@/components/ui/listing-thumb";
import { DonationStatusChip } from "@/components/donation-status-chip";
import { cn } from "@/lib/utils";

type Filter = DonationStatusType | "ALL";
const FILTERS: Filter[] = [...Object.values(DonationStatus), "ALL"];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Donation offers waiting to be matched by hand (REDESIGN-PLAN.md phase 6).
 * `?donor=` narrows the queue to one donor — that's where a DONATION_OFFERED
 * notification lands, since notifications link through the donor.
 *
 * The route is prerendered, so the query is read with useSearchParams inside
 * a Suspense boundary (the page's `searchParams` prop is empty at prerender
 * time and never carried the donor through).
 */
export default function AdminDonationsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <QueueFromUrl />
    </Suspense>
  );
}

function QueueFromUrl() {
  const donor = useSearchParams().get("donor") || null;
  // Keyed so arriving with (or dropping) a donor resets the status tab.
  return <DonationsQueue key={donor ?? ""} donor={donor} />;
}

function DonationsQueue({ donor }: { donor: string | null }) {
  const [filter, setFilter] = useState<Filter>(donor ? "ALL" : "NEW");

  const qs = new URLSearchParams();
  if (filter !== "ALL") qs.set("status", filter);
  if (donor) qs.set("donor", donor);
  const query = qs.toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-donations", filter, donor],
    queryFn: () => authedRequest<DonationOffer[]>(`/admin/donations${query ? `?${query}` : ""}`),
  });

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Preloved</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Donations</h1>
        <p className="mt-2 text-muted-foreground">
          Items moms have offered to give away. Contact the donor, match the item with a mom who needs it, and record
          the handover.
        </p>
      </header>

      {donor && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-sky/40 px-4 py-3 text-sm text-sky-ink">
          <span>Showing offers from one donor{data?.[0] ? ` — ${data[0].contactName}` : ""}.</span>
          <Link href="/admin/donations" className="inline-flex items-center gap-1 font-semibold hover:underline">
            <X className="h-4 w-4" /> Show all donations
          </Link>
        </div>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f === "ALL" ? "All" : DONATION_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : error ? (
        <StatePanel tone="error" title="Couldn't load donations" description={error instanceof Error ? error.message : "Try again in a moment."} />
      ) : !data || data.length === 0 ? (
        <StatePanel
          icon={Gift}
          title="Nothing here"
          description={filter === "NEW" ? "New donation offers will show up here." : "No donations have this status."}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {data.map((d) => (
            <Link
              key={d.id}
              href={`/admin/donations/${d.id}`}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                {d.images[0] ? <ListingThumb src={d.images[0]} alt="" /> : <Gift className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-foreground">{d.itemsDescription}</span>
                  <DonationStatusChip status={d.status} />
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {d.contactName} · {[d.city, d.locality].filter(Boolean).join(" · ")}
                  {d.category ? ` · ${d.category.name}` : ""}
                </span>
              </span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{fmtDate(d.createdAt)}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
