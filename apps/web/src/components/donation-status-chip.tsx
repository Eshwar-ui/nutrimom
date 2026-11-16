import { DONATION_STATUS_LABELS, type DonationStatus } from "@nutrimom/shared";
import { cn } from "@/lib/utils";

const styles: Record<DonationStatus, string> = {
  NEW: "bg-gold/20 text-gold-ink",
  CONTACTED: "bg-sky/60 text-sky-ink",
  MATCHED: "bg-lavender/60 text-lavender-ink",
  COMPLETED: "bg-sage/50 text-sage-ink",
  DECLINED: "bg-muted text-muted-foreground",
};

export function DonationStatusChip({ status, className }: { status: DonationStatus; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold", styles[status], className)}>
      {DONATION_STATUS_LABELS[status]}
    </span>
  );
}
