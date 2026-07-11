"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Printer, XCircle } from "lucide-react";
import { formatPaise, type Order } from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { useAuthStore } from "@/lib/auth-store";
import { Container, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Confetti } from "@/components/confetti";
import { ReviewForm } from "@/components/review-form";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => authedRequest<Order>(`/orders/${id}`),
    enabled: mounted && !!user,
  });

  const cancel = useMutation({
    mutationFn: () => authedRequest<Order>(`/orders/${id}/cancel`, { method: "PATCH" }),
    onSuccess: (updated) => {
      qc.setQueryData(["order", id], updated);
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Order cancelled");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't cancel this order.");
    },
  });

  if (!mounted || !user) return <Container className="py-16" />;
  if (isLoading) return <Container className="py-16 text-muted-foreground">Loading order…</Container>;
  if (!order)
    return (
      <Container className="py-16 text-center">
        <h1 className="font-display text-3xl font-semibold">Order not found</h1>
      </Container>
    );

  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";
  const cancellable = order.status === "PENDING" || order.status === "PAID";
  const reviewable = ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);

  return (
    <Container className="max-w-2xl py-14">
      {paid && <Confetti />}
      <div className="text-center">
        {paid && (
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/12">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
        )}
        <h1 className="mt-5 font-display text-4xl font-semibold text-foreground">
          {paid ? "Yay, it's yours!" : "Order placed"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Order <span className="font-medium text-foreground">#{order.id.slice(-8).toUpperCase()}</span>
        </p>
        <div className="mt-3 flex justify-center">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <Card className="mt-8 p-6">
        <div className="space-y-5">
          {order.items.map((item) => (
            <div key={item.id}>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.listingTitle} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="flex-1 font-medium text-foreground">{item.listingTitle}</p>
                <span className="font-semibold text-foreground">{formatPaise(item.unitPriceInPaise)}</span>
              </div>
              {reviewable && (
                <div className="print:hidden">
                  <ReviewForm orderId={order.id} listingId={item.listingId} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="my-5 border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Total paid</span>
          <span className="text-xl font-bold text-foreground">{formatPaise(order.totalInPaise)}</span>
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Delivering to</h2>
        <address className="text-sm not-italic leading-relaxed text-muted-foreground">
          {order.shippingAddress.fullName}<br />
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
          {order.shippingAddress.country} · {order.shippingAddress.phone}
        </address>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
        <Link href="/account/orders"><Button variant="outline">My orders</Button></Link>
        <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print receipt
        </Button>
        {cancellable && (
          <Button
            variant="outline"
            className="gap-1.5 text-accent hover:border-accent/40"
            disabled={cancel.isPending}
            onClick={() => {
              if (window.confirm("Cancel this order? This can't be undone.")) cancel.mutate();
            }}
          >
            <XCircle className="h-4 w-4" /> {cancel.isPending ? "Cancelling…" : "Cancel order"}
          </Button>
        )}
        <Link href="/listings"><Button>Keep browsing</Button></Link>
      </div>
    </Container>
  );
}
