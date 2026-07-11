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
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      authedRequest(`/admin/listings/${id}/moderate`, { method: "PATCH", body: { status } }),
    onSuccess: invalidate,
  });
  const feature = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      authedRequest(`/admin/listings/${id}/feature`, { method: "PATCH", body: { isFeatured } }),
    onSuccess: invalidate,
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-foreground">Listings</h1>

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
        <p className="text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Nothing here.</Card>
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
                      onClick={() => moderate.mutate({ id: l.id, status: "REJECTED" })}>
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
