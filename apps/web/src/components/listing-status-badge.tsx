import type { ListingStatus } from "@nutrimom/shared";
import { cn } from "@/lib/utils";

const styles: Record<ListingStatus, string> = {
  PENDING: "bg-gold/20 text-gold-ink",
  APPROVED: "bg-sage/50 text-sage-ink",
  REJECTED: "bg-accent/15 text-accent-text",
  RESERVED: "bg-sky/60 text-sky-ink",
  SOLD: "bg-muted text-muted-foreground",
};

// Plain words. The three a buyer can ever see — Available, Reserved, Sold —
// read the same to the seller and the admin; the other two only ever appear
// on the seller's and admin's own screens.
const labels: Record<ListingStatus, string> = {
  PENDING: "In review",
  APPROVED: "Available",
  REJECTED: "Not approved",
  RESERVED: "Reserved",
  SOLD: "Sold",
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", styles[status])}>
      {labels[status]}
    </span>
  );
}
