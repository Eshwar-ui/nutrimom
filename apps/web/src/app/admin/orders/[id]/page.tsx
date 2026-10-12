"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { formatPaise, shipmentStatusLabels, type AdminOrderDetail } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { ListingThumb } from "@/components/ui/listing-thumb";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => authedRequest<AdminOrderDetail>(`/admin/orders/${id}`),
    retry: false,
  });

  if (isLoading) return <PageSkeleton rows={4} />;
  if (error || !order) {
    return (
      <StatePanel
        tone="error"
        title="Order not found"
        description="It may have been removed, or the link might be wrong."
        action={
          <Link href="/admin/orders" className="text-sm underline">
            Back to orders
          </Link>
        }
      />
    );
  }

  const sellerName = (sellerId: string) =>
    order.sellers.find((s) => s.id === sellerId)?.name ?? "Unknown seller";
  const shipmentFor = (sellerId: string) =>
    order.shipments.find((s) => s.sellerId === sellerId);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <header className="mt-4 mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Order</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} />
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const shipment = shipmentFor(item.sellerId);
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <ListingThumb src={item.image} alt={item.listingTitle} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{item.listingTitle}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Sold by {sellerName(item.sellerId)}
                        {shipment && ` · ${shipmentStatusLabels[shipment.status]}`}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">{formatPaise(item.unitPriceInPaise)}</span>
                  </div>
                );
              })}
            </div>
            <div className="my-4 border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">{formatPaise(order.totalInPaise)}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Shipping address</h2>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country} · {order.shippingAddress.phone}
            </address>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Buyer</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={order.buyer.name} />
              <Row label="Email" value={order.buyer.email} />
              <Row label="WhatsApp" value={order.buyer.whatsappNumber ?? "—"} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Payment</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Method" value={order.paymentMethod === "COD" ? "COD (retired)" : "Online"} />
              <Row label="Gateway order" value={order.razorpayOrderId ?? "—"} mono />
              <Row label="Gateway payment" value={order.razorpayPaymentId ?? "—"} mono />
              {order.refundId && <Row label="Refund" value={order.refundId} mono />}
              {order.refundedAt && (
                <Row
                  label="Refunded"
                  value={new Date(order.refundedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                />
              )}
            </dl>
          </Card>

          {order.cancellationReason && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Cancellation</h2>
              <dl className="space-y-2 text-sm">
                <Row label="Reason" value={order.cancellationReason} />
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 truncate text-right text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
