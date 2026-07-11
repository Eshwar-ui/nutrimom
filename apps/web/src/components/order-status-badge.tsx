import type { OrderStatus } from "@nutrimom/shared";
import { cn } from "@/lib/utils";

const styles: Record<OrderStatus, string> = {
  PENDING: "bg-gold/20 text-gold",
  PAID: "bg-accent/15 text-accent",
  SHIPPED: "bg-primary/15 text-primary",
  DELIVERED: "bg-emerald-500/15 text-emerald-600",
  CANCELLED: "bg-muted text-muted-foreground",
};

const labels: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
