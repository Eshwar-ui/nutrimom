"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Package, Printer, Truck } from "lucide-react";
import {
  formatPaise,
  shipmentStatusLabels,
  type SellerSale,
} from "@nutrimom/shared";
import { generateLabel, getSales, markShipped, openLabel } from "@/lib/sales";
import { useRequireAuth } from "@/lib/use-auth";
import { toast } from "@/lib/toast-store";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

export default function SalesPage() {
  const { ready } = useRequireAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: sales, isLoading } = useQuery({
    queryKey: ["seller-sales"],
    queryFn: getSales,
    enabled: ready,
  });

  const fail = (e: unknown) =>
    toast.error(
      e instanceof ApiError || e instanceof Error
        ? e.message
        : "Something went wrong",
    );

  const onLabel = async (orderId: string) => {
    setBusy(`${orderId}:label`);
    try {
      const label = await generateLabel(orderId);
      openLabel(label);
      await qc.invalidateQueries({ queryKey: ["seller-sales"] });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const onShip = async (orderId: string) => {
    setBusy(`${orderId}:ship`);
    try {
      await markShipped(orderId);
      toast.success("Marked as shipped.");
      await qc.invalidateQueries({ queryKey: ["seller-sales"] });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  if (!ready || isLoading) return <PageSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Orders to fulfil — generate a shipping label, print it, then mark it shipped."
      />
      {!sales || sales.length === 0 ? (
        <StatePanel
          icon={Package}
          title="No sales yet"
          description="When a buyer pays for one of your items, it shows up here to fulfil."
        />
      ) : (
        <div className="space-y-4">
          {sales.map((s) => (
            <SaleCard
              key={s.orderId}
              sale={s}
              busy={busy}
              onLabel={onLabel}
              onShip={onShip}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SellerSale["shipmentStatus"] }) {
  const tone =
    status === "SHIPPED" || status === "DELIVERED"
      ? "bg-primary/10 text-primary"
      : status === "LABEL_GENERATED"
        ? "bg-sky/40 text-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}
    >
      {shipmentStatusLabels[status]}
    </span>
  );
}

function SaleCard({
  sale,
  busy,
  onLabel,
  onShip,
}: {
  sale: SellerSale;
  busy: string | null;
  onLabel: (id: string) => void;
  onShip: (id: string) => void;
}) {
  const ref = sale.orderId.slice(-6).toUpperCase();
  const total = sale.items.reduce((s, i) => s + i.unitPriceInPaise, 0);
  const labelBusy = busy === `${sale.orderId}:label`;
  const shipBusy = busy === `${sale.orderId}:ship`;
  const shipped =
    sale.shipmentStatus === "SHIPPED" || sale.shipmentStatus === "DELIVERED";

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-foreground">
            #{ref}
          </span>
          <StatusBadge status={sale.shipmentStatus} />
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(sale.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          · ship to {sale.shipToCity}, {sale.shipToState}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {sale.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <span className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {item.title}
            </span>
            <span className="text-sm font-medium text-foreground">
              {formatPaise(item.unitPriceInPaise)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Payout total </span>
          <span className="font-semibold text-foreground">
            {formatPaise(total)}
          </span>
          {sale.trackingId && (
            <span className="ml-3 text-xs text-muted-foreground">
              Ref {sale.trackingId}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLabel(sale.orderId)}
            disabled={labelBusy || shipBusy}
          >
            {labelBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {sale.shipmentStatus === "PENDING" ? "Generate label" : "Print label"}
          </Button>
          {!shipped && (
            <Button
              size="sm"
              onClick={() => onShip(sale.orderId)}
              disabled={
                shipBusy || labelBusy || sale.shipmentStatus === "PENDING"
              }
              title={
                sale.shipmentStatus === "PENDING"
                  ? "Generate the label first"
                  : undefined
              }
            >
              {shipBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Mark shipped
            </Button>
          )}
          {shipped && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Check className="h-4 w-4" /> Shipped
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
