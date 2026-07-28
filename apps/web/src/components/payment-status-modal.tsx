"use client";

import { AlertTriangle, CheckCircle2, Info, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaymentOutcome } from "@/lib/payment-outcome";

const tones = {
  success: { icon: CheckCircle2, wrap: "bg-primary/10 text-primary" },
  warning: { icon: AlertTriangle, wrap: "bg-gold/20 text-foreground" },
  error: { icon: XCircle, wrap: "bg-danger/10 text-danger" },
  neutral: { icon: Info, wrap: "bg-muted text-muted-foreground" },
} as const;

/**
 * Blocking overlay shown between "gateway captured the payment" and "our server
 * confirmed it". The buyer must not close the tab during this window, so it has
 * no dismiss affordance by design.
 */
export function PaymentVerifyingOverlay({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[85] grid place-items-center bg-foreground/45 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-live="assertive"
      aria-label="Confirming your payment"
    >
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 text-center card-shadow-lift">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </span>
        <h2 className="mt-5 font-display text-xl font-semibold text-foreground">
          Confirming your payment
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your payment went through. We&apos;re recording it now — please don&apos;t close
          or refresh this page.
        </p>
      </div>
    </div>
  );
}

/**
 * Renders any {@link PaymentOutcome}. `charged` outcomes are deliberately styled
 * as reassurance rather than failure, and can't be mistaken for "payment lost".
 */
export function PaymentStatusModal({
  outcome,
  onClose,
  onRetry,
  retrying = false,
  secondary,
}: {
  outcome: PaymentOutcome | null;
  onClose: () => void;
  onRetry?: () => void;
  retrying?: boolean;
  secondary?: React.ReactNode;
}) {
  if (!outcome) return null;
  const { icon: Icon, wrap } = tones[outcome.tone];

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="payment-outcome-title"
      describedBy="payment-outcome-description"
      className="text-center"
    >
      <span className={cn("mx-auto grid h-14 w-14 place-items-center rounded-full", wrap)}>
        <Icon className="h-6 w-6" />
      </span>

      <h2
        id="payment-outcome-title"
        className="mt-5 font-display text-2xl font-semibold text-foreground"
      >
        {outcome.title}
      </h2>

      <p
        id="payment-outcome-description"
        className="mt-2 text-sm leading-relaxed text-muted-foreground"
      >
        {outcome.description}
      </p>

      {outcome.charged && (
        <p className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl bg-primary/5 px-4 py-2.5 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Your money is safe
        </p>
      )}

      {outcome.reference && (
        <p className="mt-3 text-xs text-muted-foreground">
          Payment reference
          <br />
          <span className="mt-1 inline-block rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground">
            {outcome.reference}
          </span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {outcome.retryLabel && onRetry && (
          <Button onClick={onRetry} disabled={retrying} className="gap-1.5">
            {retrying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {retrying ? "Checking…" : outcome.retryLabel}
          </Button>
        )}
        {secondary}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
