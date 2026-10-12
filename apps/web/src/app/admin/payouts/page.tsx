"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  PayoutStatus,
  formatPaise,
  payoutStatusLabels,
  type AdminPayout,
} from "@nutrimom/shared";
import { ApiError } from "@/lib/api";
import { getAdminPayouts, markPayoutPaid } from "@/lib/payouts";
import { toast } from "@/lib/toast-store";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const statusStyles: Record<PayoutStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PAYABLE: "bg-gold/20 text-gold",
  PAID: "bg-primary/15 text-primary",
  CANCELLED: "bg-danger/10 text-danger",
};

const statusIcons: Record<PayoutStatus, typeof Clock> = {
  PENDING: Clock,
  PAYABLE: Banknote,
  PAID: CheckCircle2,
  CANCELLED: XCircle,
};

const filters = [
  { value: undefined, label: "All" },
  { value: PayoutStatus.PAYABLE, label: "Ready to pay" },
  { value: PayoutStatus.PENDING, label: "On hold" },
  { value: PayoutStatus.PAID, label: "Paid" },
  { value: PayoutStatus.CANCELLED, label: "Cancelled" },
] as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function AdminPayoutsPage() {
  const [filter, setFilter] = useState<PayoutStatus | undefined>(
    PayoutStatus.PAYABLE,
  );
  const [paying, setPaying] = useState<AdminPayout | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts", filter ?? "all"],
    queryFn: () => getAdminPayouts(filter),
  });

  const owed = (data ?? [])
    .filter((p) => p.status === "PAYABLE")
    .reduce((sum, p) => sum + p.netInPaise, 0);

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">
          Money out
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Seller payouts
        </h1>
        <p className="mt-2 text-muted-foreground">
          Buyers pay the marketplace, so every delivered order leaves you owing
          the seller. Transfer the net amount, then record the reference here.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === PayoutStatus.PAYABLE && owed > 0 && (
        <Card className="mb-6 flex items-center justify-between p-5">
          <span className="text-sm font-medium text-muted-foreground">
            Outstanding to sellers
          </span>
          <span className="text-2xl font-bold text-foreground">
            {formatPaise(owed)}
          </span>
        </Card>
      )}

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <StatePanel
          title="Nothing here"
          description="Payouts appear once an order is paid, and become payable once it's delivered."
        />
      ) : (
        <Card className="divide-y divide-border">
          {data.map((payout) => (
            <PayoutRow
              key={payout.id}
              payout={payout}
              onPay={() => setPaying(payout)}
            />
          ))}
        </Card>
      )}

      {paying && (
        <MarkPaidDialog payout={paying} onClose={() => setPaying(null)} />
      )}
    </div>
  );
}

function PayoutRow({
  payout,
  onPay,
}: {
  payout: AdminPayout;
  onPay: () => void;
}) {
  const Icon = statusIcons[payout.status];
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">
            {payout.sellerName}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              statusStyles[payout.status],
            )}
          >
            <Icon className="h-3 w-3" /> {payoutStatusLabels[payout.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {payout.orderNumber} · {payout.itemCount} item
          {payout.itemCount === 1 ? "" : "s"} · {fmtDate(payout.createdAt)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {payout.sellerEmail}
          {payout.sellerWhatsapp && ` · ${payout.sellerWhatsapp}`}
        </p>
        {payout.reference && (
          <p className="mt-1 text-xs text-muted-foreground">
            Ref {payout.reference}
            {payout.paidAt && ` · paid ${fmtDate(payout.paidAt)}`}
          </p>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">
            {formatPaise(payout.netInPaise)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPaise(payout.grossInPaise)} less{" "}
            {formatPaise(payout.commissionInPaise)} fee
          </p>
        </div>
        {payout.status === "PAYABLE" && (
          <Button size="sm" onClick={onPay}>
            Mark paid
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Recording a transfer is the point of no return in the ledger — a PAID
 * payout can't be cancelled by an order cancellation afterwards — so it takes
 * a real reference rather than a bare confirm.
 */
function MarkPaidDialog({
  payout,
  onClose,
}: {
  payout: AdminPayout;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [reference, setReference] = useState("");

  const pay = useMutation({
    mutationFn: () => markPayoutPaid(payout.id, { reference: reference.trim() }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast.success(`Recorded ${formatPaise(payout.netInPaise)} to ${payout.sellerName}`);
      onClose();
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't record the payout",
      ),
  });

  return (
    <Modal open onClose={onClose} labelledBy="mark-paid-title" className="max-w-md">
      <h2
        id="mark-paid-title"
        className="font-display text-2xl font-semibold text-foreground"
      >
        Record payout
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Confirm you have transferred{" "}
        <span className="font-semibold text-foreground">
          {formatPaise(payout.netInPaise)}
        </span>{" "}
        to {payout.sellerName} for {payout.orderNumber}. This only records the
        transfer — it does not move any money.
      </p>

      <div className="mt-5">
        <Label htmlFor="payout-reference">Transfer reference (UTR / bank ref)</Label>
        <Input
          id="payout-reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={80}
          placeholder="e.g. UTR123456789"
          className="mt-1.5"
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!reference.trim() || pay.isPending}
          onClick={() => pay.mutate()}
        >
          {pay.isPending ? "Recording…" : "Record payout"}
        </Button>
      </div>
    </Modal>
  );
}
