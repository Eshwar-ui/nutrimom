"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Printer, XCircle } from "lucide-react";
import {
  formatPaise,
  isOrderConfirmed,
  paymentMethodLabels,
  type Order,
  type OrderStatus,
  type PaymentMethod,
} from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/lib/use-store-hydrated";
import { Container, Card } from "@/components/ui/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ReviewForm } from "@/components/review-form";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const progress: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthHydrated();
  useEffect(() => { if (hydrated && !user) router.replace("/login"); }, [hydrated, user, router]);

  const { data: order, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => authedRequest<Order>(`/orders/${id}`), enabled: hydrated && !!user });
  const cancel = useMutation({
    mutationFn: () => authedRequest<Order>(`/orders/${id}/cancel`, { method: "PATCH" }),
    onSuccess: (updated) => { queryClient.setQueryData(["order", id], updated); queryClient.invalidateQueries({ queryKey: ["my-orders"] }); toast.success("Order cancelled"); },
    onError: (caught) => toast.error(caught instanceof ApiError ? caught.message : "Couldn't cancel this order."),
  });

  if (!hydrated || !user || isLoading) return <Container className="max-w-3xl py-14"><PageSkeleton rows={4} /></Container>;
  if (!order) return <Container className="max-w-3xl py-14"><StatePanel tone="error" title="Order not found" description="This order may no longer be available or may belong to another account." /></Container>;

  const confirmed = isOrderConfirmed(order.status, order.paymentMethod);
  const isCod = order.paymentMethod === "COD";
  const cancellable = order.status === "PENDING" || order.status === "PAID";
  const reviewable = ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);

  return (
    <Container className="max-w-3xl py-12 sm:py-14">
      <header className="text-center">
        {confirmed && <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10"><CheckCircle2 className="h-8 w-8 text-primary" /></div>}
        <h1 className="mt-5 font-display text-4xl font-semibold text-foreground">{order.status === "DELIVERED" ? "Delivered" : order.status === "CANCELLED" ? "Order cancelled" : confirmed ? "Your order is confirmed" : "Awaiting payment"}</h1>
        <p className="mt-2 text-muted-foreground">Order <span className="font-medium text-foreground">#{order.id.slice(-8).toUpperCase()}</span></p>
        <div className="mt-3 flex justify-center"><OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} /></div>
        {isCod && order.status !== "CANCELLED" && <p className="mt-3 text-sm text-muted-foreground">Cash on Delivery · pay <span className="font-medium text-foreground">{formatPaise(order.totalInPaise)}</span> when your order is handed over.</p>}
      </header>

      {order.status !== "CANCELLED" && <OrderTimeline status={order.status} paymentMethod={order.paymentMethod} />}

      <Card className="mt-6 p-5 sm:p-6">
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
              {reviewable && <div className="print:hidden"><ReviewForm orderId={order.id} listingId={item.listingId} /></div>}
            </div>
          ))}
        </div>
        <div className="my-5 border-t border-border" />
        <div className="flex items-center justify-between"><span className="font-medium text-foreground">{isCod ? (order.status === "DELIVERED" ? "Total paid (cash)" : "Amount due on delivery") : confirmed ? "Total paid" : "Order total"}</span><span className="text-xl font-bold text-foreground">{formatPaise(order.totalInPaise)}</span></div>
        <p className="mt-2 text-right text-xs text-muted-foreground">{paymentMethodLabels[order.paymentMethod]}</p>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Delivery address</h2>
        <address className="text-sm not-italic leading-relaxed text-muted-foreground">{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.country} · {order.shippingAddress.phone}</address>
      </Card>

      <div className="mt-7 flex flex-wrap justify-center gap-3 print:hidden">
        <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>My orders</Link>
        <Button variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print receipt</Button>
        <Link href="/listings" className={buttonVariants()}>Keep browsing</Link>
      </div>

      {cancellable && (
        <div className="mt-10 border-t border-border pt-6 text-center print:hidden">
          <p className="text-sm text-muted-foreground">Need to stop this order? Cancellation after payment may require support review.</p>
          <Button variant="ghost" className="mt-3 gap-1.5 text-danger hover:bg-danger/10" disabled={cancel.isPending} onClick={() => { if (window.confirm("Cancel this order? This can't be undone.")) cancel.mutate(); }}><XCircle className="h-4 w-4" /> {cancel.isPending ? "Cancelling…" : "Cancel order"}</Button>
        </div>
      )}
    </Container>
  );
}

function OrderTimeline({ status, paymentMethod }: { status: OrderStatus; paymentMethod: PaymentMethod }) {
  // COD has no "paid" step — the order is placed, then shipped, then delivered
  // (cash changes hands at handover).
  const steps =
    paymentMethod === "COD"
      ? [
          { label: "Placed", reached: true },
          { label: "Shipped", reached: ["SHIPPED", "DELIVERED"].includes(status) },
          { label: "Delivered", reached: status === "DELIVERED" },
        ]
      : progress.map((step) => ({
          label: step.toLowerCase(),
          reached: progress.indexOf(status) >= progress.indexOf(step),
        }));

  return (
    <ol className={cn("mt-8 grid", paymentMethod === "COD" ? "grid-cols-3" : "grid-cols-4")} aria-label="Order progress">
      {steps.map((step, index) => (
        <li key={step.label} className="relative text-center"><span className={cn("relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full border text-xs font-bold", step.reached ? "border-primary bg-primary text-primary-foreground" : "border-border-control/50 bg-background text-muted-foreground")}>{step.reached ? <Check className="h-4 w-4" /> : index + 1}</span>{index < steps.length - 1 && <span className={cn("absolute left-1/2 top-4 h-px w-full", steps[index + 1].reached ? "bg-primary" : "bg-border-control/35")} />}<span className="mt-2 block text-[11px] font-semibold capitalize text-muted-foreground sm:text-xs">{step.label}</span></li>
      ))}
    </ol>
  );
}
