"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Lock } from "lucide-react";
import { MEMBERSHIP_PLANS, REGISTRATION_FEE_PAISE, formatPaise } from "@nutrimom/shared";
import { getBillingStatus } from "@/lib/seller-billing";
import { useRequireAuth } from "@/lib/use-auth";
import { Container, Card } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { ListingForm } from "@/components/listing-form";
import { PageSkeleton } from "@/components/ui/states";

export default function SellPage() {
  const { ready } = useRequireAuth();
  const { data: status, isLoading } = useQuery({
    queryKey: ["seller-billing"],
    queryFn: getBillingStatus,
    enabled: ready,
    // The gate answer barely changes within a visit — registering, being
    // approved and buying a plan all write the result straight into this cache
    // key from /account/membership. Without it, every arrival here re-waited on
    // the round trip behind a full-page skeleton.
    staleTime: 60_000,
  });

  // Only the gated area waits. The heading and intro are static, so blanking
  // the whole page behind a skeleton made a two-second auth-plus-billing
  // resolve look like a page that had failed to load.
  const resolving = !ready || isLoading;

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold text-foreground">
        Sell an item
      </h1>
      <p className="mt-2 text-muted-foreground">
        Give your outgrown baby gear a joyful second home. It takes two minutes.
      </p>

      <div className="mt-8">
        {resolving ? (
          <PageSkeleton rows={4} />
        ) : status?.canList ? (
          <ListingForm />
        ) : (
          <Card className="flex flex-col items-start gap-4 p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {!status?.registrationPaid
                  ? "Become a verified seller to list"
                  : !status?.sellerVerified
                    ? "Awaiting admin approval"
                    : "An active membership is required to list"}
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                {!status?.registrationPaid
                  ? `A one-time ${formatPaise(REGISTRATION_FEE_PAISE)} seller registration, then a membership plan from ${formatPaise(MEMBERSHIP_PLANS.MONTHLY.priceInPaise)}/mo, unlocks listing.`
                  : !status?.sellerVerified
                    ? "Your registration is complete — an admin needs to approve your account before you can list. You can still choose a membership plan in the meantime."
                    : "Your seller account is verified. Choose a membership plan to start listing items."}
              </p>
            </div>
            <Link href="/account/membership" className={buttonVariants()}>
              <BadgeCheck className="h-4 w-4" />
              {!status?.registrationPaid ? "Get started" : !status?.sellerVerified ? "View status" : "Choose a plan"}
            </Link>
          </Card>
        )}
      </div>
    </Container>
  );
}
