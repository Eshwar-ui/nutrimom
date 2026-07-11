"use client";

import { useRequireAuth } from "@/lib/use-auth";
import { Container } from "@/components/ui/primitives";
import { ListingForm } from "@/components/listing-form";
import { PageSkeleton } from "@/components/ui/states";

export default function SellPage() {
  const { ready } = useRequireAuth();
  if (!ready) return <Container className="py-16"><PageSkeleton rows={5} /></Container>;

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold text-foreground">
        Sell an item
      </h1>
      <p className="mt-2 text-muted-foreground">
        Give your outgrown baby gear a joyful second home. It takes two minutes.
      </p>
      <div className="mt-8">
        <ListingForm />
      </div>
    </Container>
  );
}
