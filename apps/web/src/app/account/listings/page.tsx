"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPaise, type Listing } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Container, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
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

  const { data, isLoading } = useQuery({
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

  if (!ready) return <Container className="py-16"><PageSkeleton rows={4} /></Container>;

  return (
    <Container className="max-w-4xl py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl font-semibold text-foreground">My listings</h1>
        <Link href="/sell"><Button><Plus className="h-4 w-4" /> New listing</Button></Link>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Live" value={stats.approved} />
          <StatTile label="Sold" value={stats.sold} />
          <StatTile label="Pending review" value={stats.pending} />
          <StatTile label="Revenue" value={formatPaise(stats.totalRevenueInPaise)} />
        </div>
      )}

      {isLoading ? (
        <PageSkeleton rows={4} />
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
              </div>
              <ListingStatusBadge status={l.status} />
              <div className="flex gap-1">
                <Link href={`/account/listings/${l.id}/edit`}>
                  <Button variant="ghost" size="icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                </Link>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove.mutate(l.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
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
