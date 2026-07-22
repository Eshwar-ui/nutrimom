"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Star } from "lucide-react";
import { formatPaise, type Listing } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const filters = ["PENDING", "APPROVED", "SOLD", "ALL"] as const;

export default function AdminListingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof filters)[number]>("PENDING");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", filter],
    queryFn: () =>
      authedRequest<Listing[]>(
        `/admin/listings${filter === "ALL" ? "" : `?status=${filter}`}`,
      ),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-listings"] });

  const moderate = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "APPROVED" | "REJECTED"; reason?: string }) =>
      authedRequest(`/admin/listings/${id}/moderate`, { method: "PATCH", body: { status, reason } }),
    onSuccess: invalidate,
  });

  const reject = (id: string) => {
    const reason = window.prompt("Why is this listing being rejected? The seller will see this.");
    if (reason === null) return; // cancelled
    if (!reason.trim()) return window.alert("A reason is required.");
    moderate.mutate({ id, status: "REJECTED", reason: reason.trim() });
  };
  const feature = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      authedRequest(`/admin/listings/${id}/feature`, { method: "PATCH", body: { isFeatured } }),
    onSuccess: invalidate,
  });

  return (
    <div>
      <header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Moderation</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Listings</h1><p className="mt-2 text-muted-foreground">Review item details and decide what goes live.</p></header>

      <div className="mb-6 flex gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
            {f[0] + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <StatePanel title="Nothing here" description="No listings match this moderation status." />
      ) : (
        <div className="space-y-3">
          {data.map((l) => (
            <Card key={l.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {l.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/listings/${l.id}`} className="truncate font-medium text-foreground hover:text-accent">
                  {l.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatPaise(l.sellingPriceInPaise)} · {l.category.name} · by {l.seller.name}
                </p>
              </div>
              <ListingStatusBadge status={l.status} />
              <div className="flex gap-1">
                {l.status === "PENDING" && (
                  <>
                    <Button variant="ghost" size="icon" aria-label="Approve"
                      onClick={() => moderate.mutate({ id: l.id, status: "APPROVED" })}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Reject"
                      onClick={() => reject(l.id)}>
                      <X className="h-4 w-4 text-accent" />
                    </Button>
                  </>
                )}
                {l.status === "APPROVED" && (
                  <Button variant="ghost" size="icon" aria-label="Toggle featured"
                    onClick={() => feature.mutate({ id: l.id, isFeatured: !l.isFeatured })}>
                    <Star className={l.isFeatured ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4"} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
