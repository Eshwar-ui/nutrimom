"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { formatPaise, type Order } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

export default function OrdersPage() {
  const { ready } = useRequireAuth();
  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => authedRequest<Order[]>("/orders"),
    enabled: ready,
  });

  if (!ready) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-8">
      <PageHeader title="My orders" description="Track payment and handover progress on everything you've bought." />

      {isLoading ? (
        <PageSkeleton rows={3} />
      ) : isError ? (
        <StatePanel tone="error" title="Couldn't load your orders" description="Something went wrong reaching the marketplace. Check your connection and try again." action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : !orders || orders.length === 0 ? (
        <StatePanel title="No orders yet" description="When you buy a treasure, its payment and handover progress will appear here." action={<Link href="/listings" className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">Start shopping</Link>} />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="flex items-center justify-between gap-4 p-5 transition-transform hover:-translate-y-0.5">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-foreground">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {formatPaise(order.totalInPaise)}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
