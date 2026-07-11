"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Container } from "@/components/ui/primitives";
import { ListingForm } from "@/components/listing-form";

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready } = useRequireAuth();

  // Fetch from the seller's own listings so PENDING items are editable too.
  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => authedRequest<Listing[]>("/seller/listings"),
    enabled: ready,
  });

  if (!ready) return <Container className="py-16" />;
  if (isLoading) return <Container className="py-16 text-muted-foreground">Loading…</Container>;

  const listing = data?.find((l) => l.id === id);
  if (!listing)
    return (
      <Container className="py-16 text-center">
        <h1 className="font-display text-3xl font-semibold">Listing not found</h1>
      </Container>
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
