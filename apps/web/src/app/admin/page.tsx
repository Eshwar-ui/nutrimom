"use client";

import { useQuery } from "@tanstack/react-query";
import { IndianRupee, ClipboardCheck, ClipboardList, Clock } from "lucide-react";
import { formatPaise, type Listing, type Order } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageSkeleton } from "@/components/ui/states";

export default function AdminDashboard() {
  const pending = useQuery({
    queryKey: ["admin-listings", "PENDING"],
    queryFn: () => authedRequest<Listing[]>("/admin/listings?status=PENDING"),
  });
  const listings = useQuery({
    queryKey: ["admin-listings", "all"],
    queryFn: () => authedRequest<Listing[]>("/admin/listings"),
  });
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => authedRequest<Order[]>("/admin/orders"),
  });

  const revenue = (orders.data ?? [])
    .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((s, o) => s + o.totalInPaise, 0);

  if (pending.isLoading || listings.isLoading || orders.isLoading) {
    return <PageSkeleton rows={4} />;
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Admin overview</h1>
        <p className="mt-2 text-muted-foreground">Review what needs attention before scanning the totals.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<IndianRupee className="h-5 w-5" />} label="Revenue" value={formatPaise(revenue)} />
        <Stat icon={<Clock className="h-5 w-5" />} label="Awaiting review" value={String(pending.data?.length ?? "—")} />
        <Stat icon={<ClipboardCheck className="h-5 w-5" />} label="Listings" value={String(listings.data?.length ?? "—")} />
        <Stat icon={<ClipboardList className="h-5 w-5" />} label="Orders" value={String(orders.data?.length ?? "—")} />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Recent orders</h2>
        <Card className="divide-y divide-border">
          {(orders.data ?? []).slice(0, 8).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-foreground">#{o.id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">
                  {o.shippingAddress.fullName} · {o.items.length} item(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={o.status} />
                <span className="font-semibold text-foreground">{formatPaise(o.totalInPaise)}</span>
              </div>
            </div>
          ))}
          {orders.data?.length === 0 && <p className="p-8 text-center text-muted-foreground">No orders yet.</p>}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold text-foreground">{value}</p>
    </Card>
  );
}
