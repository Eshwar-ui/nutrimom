"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Container } from "@/components/ui/primitives";
import { ListingForm } from "@/components/listing-form";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready } = useRequireAuth();

  // Fetch from the seller's own listings so PENDING items are editable too.
  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => authedRequest<Listing[]>("/seller/listings"),
    enabled: ready,
  });

  if (!ready || isLoading) return <Container className="max-w-3xl py-16"><PageSkeleton rows={5} /></Container>;

  const listing = data?.find((l) => l.id === id);
  if (!listing)
    return (
      <Container className="max-w-3xl py-16"><StatePanel tone="error" title="Listing not found" description="This listing may have been removed or belongs to another seller." /></Container>
    );

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold text-foreground">Edit listing</h1>
      <div className="mt-8">
        <ListingForm initial={listing} listingId={listing.id} />
      </div>
    </Container>
  );
}
