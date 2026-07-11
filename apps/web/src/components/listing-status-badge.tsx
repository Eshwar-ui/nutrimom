import type { ListingStatus } from "@nutrimom/shared";
import { cn } from "@/lib/utils";

const styles: Record<ListingStatus, string> = {
  PENDING: "bg-gold/20 text-[#5c4410]",
  APPROVED: "bg-sage/50 text-[#2f5236]",
  REJECTED: "bg-accent/15 text-accent",
  RESERVED: "bg-sky/60 text-[#215172]",
  SOLD: "bg-muted text-muted-foreground",
};

const labels: Record<ListingStatus, string> = {
  PENDING: "In review",
  APPROVED: "Live",
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
