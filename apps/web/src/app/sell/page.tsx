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
  });

  if (!ready || isLoading)
    return (
      <Container className="py-16">
        <PageSkeleton rows={5} />
      </Container>
    );

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold text-foreground">
        Sell an item
      </h1>
      <p className="mt-2 text-muted-foreground">
        Give your outgrown baby gear a joyful second home. It takes two minutes.
      </p>

      <div className="mt-8">
        {status?.canList ? (
          <ListingForm />
        ) : (
          <Card className="flex flex-col items-start gap-4 p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {status?.registrationPaid
                  ? "An active membership is required to list"
                  : "Become a verified seller to list"}
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                {status?.registrationPaid
                  ? "Your seller registration is complete. Choose a membership plan to start listing items."
                  : `A one-time ${formatPaise(REGISTRATION_FEE_PAISE)} seller registration, then a membership plan from ${formatPaise(MEMBERSHIP_PLANS.MONTHLY.priceInPaise)}/mo, unlocks listing.`}
              </p>
            </div>
            <Link href="/account/membership" className={buttonVariants()}>
              <BadgeCheck className="h-4 w-4" />
              {status?.registrationPaid ? "Choose a plan" : "Get started"}
            </Link>
          </Card>
        )}
      </div>
    </Container>
  );
}
