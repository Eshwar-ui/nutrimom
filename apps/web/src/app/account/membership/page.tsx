"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, Loader2, Sparkles } from "lucide-react";
import {
  MEMBERSHIP_PLANS,
  MEMBERSHIP_PLAN_ORDER,
  formatPaise,
  type MembershipPlan,
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
import { ApiError } from "@/lib/api";
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
  const [busy, setBusy] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["seller-billing"],
    queryFn: getBillingStatus,
    enabled: ready,
  });

  const prefill = { name: user?.name, email: user?.email };

  const settle = (next: SellerBillingStatus, message: string) => {
    qc.setQueryData(["seller-billing"], next);
    toast.success(message);
  };
  const fail = (err: unknown) => {
    if (err instanceof Error && err.message === "Payment cancelled") return;
    toast.error(
      err instanceof ApiError || err instanceof Error
        ? err.message
        : "Payment failed",
    );
  };

  const buyRegistration = async () => {
    setBusy("registration");
    try {
      settle(
        await payRegistration(prefill),
        "Registration complete — choose a plan to start listing.",
      );
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
        await payMembership(plan, prefill),
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

      {/* Step 1 — registration */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                1
              </span>
              <h2 className="text-lg font-semibold text-foreground">
                Seller registration
              </h2>
              {registered && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Check className="h-3 w-3" /> Paid
                </span>
              )}
            </div>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              A one-time fee of{" "}
              {formatPaise(status.registrationFeePaise)} verifies your seller
              account and unlocks membership plans.
            </p>
          </div>
          {!registered && (
            <Button
              onClick={buyRegistration}
              disabled={busy !== null}
              className="shrink-0"
            >
              {busy === "registration" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Opening…
                </>
              ) : (
                `Pay ${formatPaise(status.registrationFeePaise)}`
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Step 2 — plans */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              registered
                ? "bg-muted text-muted-foreground"
                : "bg-muted/50 text-muted-foreground/50"
            }`}
          >
            2
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            Choose a membership plan
          </h2>
        </div>
        {!registered && (
          <p className="mb-3 text-sm text-muted-foreground">
            Complete registration above to unlock plans.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MEMBERSHIP_PLAN_ORDER.map((key) => {
            const plan = MEMBERSHIP_PLANS[key];
            const isActive = status.activePlan === key && status.canList;
            return (
              <Card
                key={key}
                className={`relative flex flex-col p-5 ${
                  plan.bestValue ? "border-primary/40" : ""
                }`}
              >
                {plan.bestValue && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    <Sparkles className="h-3 w-3" /> Best value
                  </span>
                )}
                <h3 className="font-semibold text-foreground">{plan.label}</h3>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatPaise(plan.priceInPaise)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {plan.durationDays} days of listing access
                </p>
                <Button
                  variant={plan.bestValue ? "primary" : "outline"}
                  className="mt-4 w-full"
                  disabled={!registered || busy !== null}
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
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
