"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, Check, Loader2, Sparkles } from "lucide-react";
import {
  MEMBERSHIP_PLANS,
  MEMBERSHIP_PLAN_ORDER,
  formatPaise,
  type MembershipPlan,
  type MembershipPlanInfo,
  type SellerBillingStatus,
} from "@nutrimom/shared";
import {
  getBillingStatus,
  payMembership,
  payRegistration,
} from "@/lib/seller-billing";
import { useRequireAuth } from "@/lib/use-auth";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast-store";
import {
  classifyPaymentError,
  type PaymentOutcome,
} from "@/lib/payment-outcome";
import {
  PaymentStatusModal,
  PaymentVerifyingOverlay,
} from "@/components/payment-status-modal";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/states";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function MembershipPage() {
  const { ready } = useRequireAuth();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["seller-billing"],
    queryFn: getBillingStatus,
    enabled: ready,
  });

  const prefill = { name: user?.name, email: user?.email };

  const hooks = {
    onVerifyStart: () => setVerifying(true),
    onVerifyEnd: () => setVerifying(false),
  };

  const settle = (next: SellerBillingStatus, message: string) => {
    qc.setQueryData(["seller-billing"], next);
    toast.success(message);
  };
  const fail = (err: unknown) => {
    const classified = classifyPaymentError(err);
    // A dismissed modal is a non-event — the seller chose it and nothing was
    // charged, so don't interrupt them with a dialog about it.
    if (classified.kind === "cancelled") return;
    setOutcome(classified);
  };

  /** Re-read billing status after a captured-but-unconfirmed payment. */
  const recheckStatus = async () => {
    setRechecking(true);
    try {
      const latest = await getBillingStatus();
      qc.setQueryData(["seller-billing"], latest);
      if (latest.canList || latest.registrationPaid) {
        if (latest.registrationPaid && user && !user.registrationPaidAt) {
          setUser({ ...user, registrationPaidAt: new Date().toISOString() });
        }
        setOutcome(null);
        toast.success("Payment confirmed");
      } else {
        toast.info("Still confirming — this can take a minute.");
      }
    } catch {
      toast.error("Couldn't reach us just now. Your payment is still safe.");
    } finally {
      setRechecking(false);
    }
  };

  const buyRegistration = async () => {
    setBusy("registration");
    try {
      settle(
        await payRegistration(prefill, hooks),
        "Registration complete — choose a plan to start listing.",
      );
      // The auth store's cached user predates this payment — refresh it so
      // the account nav (gated on registrationPaidAt) unlocks immediately
      // instead of waiting for the next login.
      if (user && !user.registrationPaidAt) {
        setUser({ ...user, registrationPaidAt: new Date().toISOString() });
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const buyPlan = async (plan: MembershipPlan) => {
    setBusy(plan);
    try {
      settle(
        await payMembership(plan, prefill, hooks),
        "Membership active — you can now list items.",
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  if (!ready || isLoading || !status) return <PageSkeleton rows={4} />;

  const registered = status.registrationPaid;

  // A plain customer who's never registered to sell gets an explainer + CTA
  // instead of the raw purchase form — buying never requires membership, so
  // this page otherwise reads as a confusing paywall with no context.
  if (!registered) {
    return (
      <div className="space-y-6">
        <PageHeader title="Membership" description="How selling on the marketplace works." />

        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BadgeCheck className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">What is a seller membership?</h2>
              <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                Buying never requires membership — browse and check out freely. To sell, a
                one-time {formatPaise(status.registrationFeePaise)} registration verifies your
                account (an admin reviews it), then an active membership plan keeps your listings
                live. Plans run from {formatPaise(MEMBERSHIP_PLANS.MONTHLY.priceInPaise)}/month up
                to {formatPaise(MEMBERSHIP_PLANS.YEARLY.priceInPaise)}/year.
              </p>
            </div>
          </div>
          <Button onClick={buyRegistration} disabled={busy !== null} className="mt-6">
            {busy === "registration" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Opening…
              </>
            ) : (
              `Become a seller — pay ${formatPaise(status.registrationFeePaise)}`
            )}
          </Button>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MEMBERSHIP_PLAN_ORDER.map((key) => (
            <PlanCard key={key} plan={MEMBERSHIP_PLANS[key]} />
          ))}
        </div>

        <PaymentVerifyingOverlay open={verifying} />
        <PaymentStatusModal
          outcome={outcome}
          retrying={rechecking}
          onRetry={outcome?.charged ? () => void recheckStatus() : undefined}
          onClose={() => setOutcome(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership"
        description="Register once, then keep an active plan to list items on the marketplace."
      />

      {status.canList && status.membershipExpiresAt && (
        <Card className="flex items-center gap-3 border-primary/30 bg-primary/5 p-5">
          <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            You&apos;re all set. Your{" "}
            <span className="font-semibold">
              {status.activePlan
                ? MEMBERSHIP_PLANS[status.activePlan].label
                : ""}
            </span>{" "}
            membership is active until{" "}
            <span className="font-semibold">
              {fmtDate(status.membershipExpiresAt)}
            </span>
            .
          </p>
        </Card>
      )}

      {status.registrationPaid && !status.sellerVerified && (
        <Card className="flex items-center gap-3 border-gold/30 bg-gold/5 p-5">
          <AlertTriangle className="h-6 w-6 shrink-0 text-gold" />
          <p className="text-sm text-foreground">
            Your registration is complete. An admin needs to approve your
            account before you can list items — you can still choose a plan
            below in the meantime.
          </p>
        </Card>
      )}

      {!status.canList && status.sellerVerified && status.lastMembershipExpiredAt && (
        <Card className="flex items-center gap-3 border-danger/30 bg-danger/5 p-5">
          <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
          <p className="text-sm text-foreground">
            Your membership expired on{" "}
            <span className="font-semibold">
              {fmtDate(status.lastMembershipExpiredAt)}
            </span>
            . Renew below to list new items — your existing listings stay live either way.
          </p>
        </Card>
      )}

      {/* Step 1 — registration (always paid in this branch — see the !registered early return above) */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            1
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            Seller registration
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <Check className="h-3 w-3" /> Paid
          </span>
        </div>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Your one-time {formatPaise(status.registrationFeePaise)} registration is complete. An
          admin will verify your account (see your{" "}
          <Link href="/account" className="underline">
            profile
          </Link>
          ) before you can start listing.
        </p>
      </Card>

      {/* Step 2 — plans */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            2
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            Choose a membership plan
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MEMBERSHIP_PLAN_ORDER.map((key) => {
            const plan = MEMBERSHIP_PLANS[key];
            const isActive = status.activePlan === key && status.canList;
            return (
              <PlanCard key={key} plan={plan}>
                <Button
                  variant={plan.bestValue ? "primary" : "outline"}
                  className="mt-4 w-full"
                  disabled={busy !== null}
                  onClick={() => buyPlan(key)}
                >
                  {busy === key ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Opening…
                    </>
                  ) : isActive ? (
                    "Extend"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </PlanCard>
            );
          })}
        </div>
      </div>

      <PaymentVerifyingOverlay open={verifying} />
      <PaymentStatusModal
        outcome={outcome}
        retrying={rechecking}
        onRetry={outcome?.charged ? () => void recheckStatus() : undefined}
        onClose={() => setOutcome(null)}
      />
    </div>
  );
}

/** Plan price/duration card. `children`, when given, renders a purchase
 * action below — omitted for the read-only explainer shown to non-sellers. */
function PlanCard({ plan, children }: { plan: MembershipPlanInfo; children?: React.ReactNode }) {
  return (
    <Card className={`relative flex flex-col p-5 ${plan.bestValue ? "border-primary/40" : ""}`}>
      {plan.bestValue && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          <Sparkles className="h-3 w-3" /> Best value
        </span>
      )}
      <h3 className="font-semibold text-foreground">{plan.label}</h3>
      <p className="mt-1 text-2xl font-bold text-foreground">{formatPaise(plan.priceInPaise)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{plan.durationDays} days of listing access</p>
      {children}
    </Card>
  );
}
