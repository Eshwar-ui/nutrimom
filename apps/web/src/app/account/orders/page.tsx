"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { formatPaise, type Order } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Container, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

export default function OrdersPage() {
  const { ready } = useRequireAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => authedRequest<Order[]>("/orders"),
    enabled: ready,
  });

  if (!ready) return <Container className="py-16"><PageSkeleton rows={3} /></Container>;

  return (
    <Container className="max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">
        My orders
      </h1>

      {isLoading ? (
        <PageSkeleton rows={3} className="mt-8" />
      ) : !orders || orders.length === 0 ? (
        <StatePanel className="mt-8" title="No orders yet" description="When you buy a treasure, its payment and handover progress will appear here." action={<Link href="/listings" className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">Start shopping</Link>} />
      ) : (
        <div className="mt-8 space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="flex items-center justify-between gap-4 p-5 transition-transform hover:-translate-y-0.5">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-foreground">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <OrderStatusBadge status={order.status} />
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
    </Container>
  );
}
