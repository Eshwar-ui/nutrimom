import { orderStatusLabel, type OrderStatus, type PaymentMethod } from "@nutrimom/shared";
import { cn } from "@/lib/utils";

// Tint + readable ink from the palette tokens. (Was gold-on-gold, terracotta-
// on-terracotta and a stock emerald — all under 3:1.)
const styles: Record<OrderStatus, string> = {
  PENDING: "bg-gold/20 text-gold-ink",
  PAID: "bg-accent/15 text-accent-text",
  SHIPPED: "bg-primary/10 text-primary",
  DELIVERED: "bg-sage/50 text-sage-ink",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function OrderStatusBadge({
  status,
  paymentMethod,
}: {
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        styles[status],
      )}
    >
      {orderStatusLabel(status, paymentMethod)}
    </span>
  );
}
