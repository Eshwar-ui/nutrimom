"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPaise, type Listing } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

interface SellerStats {
  pending: number;
  approved: number;
  sold: number;
  rejected: number;
  totalRevenueInPaise: number;
}

export default function MyListingsPage() {
  const { ready } = useRequireAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => authedRequest<Listing[]>("/seller/listings"),
    enabled: ready,
  });

  const { data: stats } = useQuery({
    queryKey: ["seller-stats"],
    queryFn: () => authedRequest<SellerStats>("/seller/listings/stats"),
    enabled: ready,
  });

  const remove = useMutation({
    mutationFn: (id: string) => authedRequest(`/seller/listings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-listings"] }),
  });

  if (!ready) return <PageSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My listings"
        description="Everything you've put up for sale, and how it's doing."
        actions={<Link href="/sell" className={buttonVariants()}><Plus className="h-4 w-4" /> New listing</Link>}
      />

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Live" value={stats.approved} />
          <StatTile label="Sold" value={stats.sold} />
          <StatTile label="Pending review" value={stats.pending} />
          <StatTile label="Not approved" value={stats.rejected} />
          <StatTile label="Revenue" value={formatPaise(stats.totalRevenueInPaise)} />
        </div>
      )}

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : isError ? (
        <StatePanel tone="error" title="Couldn't load your listings" description="Something went wrong reaching the marketplace. Check your connection and try again." action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : !data || data.length === 0 ? (
        <StatePanel title="No listings yet" description="List the baby gear your family has outgrown and it will appear here for review." action={<Link href="/sell" className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">Sell your first item</Link>} />
      ) : (
        <div className="space-y-3">
          {data.map((l) => (
            <Card key={l.id} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                {l.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{l.title}</p>
                <p className="text-sm text-muted-foreground">{formatPaise(l.sellingPriceInPaise)} · {l.city}</p>
                {l.status === "REJECTED" && l.rejectionReason && (
                  <p className="mt-1 text-sm text-danger">Not approved: {l.rejectionReason}</p>
                )}
              </div>
              <ListingStatusBadge status={l.status} />
              <div className="flex gap-1">
                <Link href={`/account/listings/${l.id}/edit`} aria-label="Edit" className={buttonVariants({ variant: "ghost", size: "icon" })}><Pencil className="h-4 w-4" /></Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => {
                    if (window.confirm(`Delete "${l.title}"? This can't be undone.`)) remove.mutate(l.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </Card>
  );
}
