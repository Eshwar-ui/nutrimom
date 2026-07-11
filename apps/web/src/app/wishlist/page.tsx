"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import type { Listing } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { AccountShell } from "@/components/account-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ListingCard } from "@/components/listing-card";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

export default function WishlistPage() {
  const { ready } = useRequireAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => authedRequest<Listing[]>("/wishlist"),
    enabled: ready,
  });

  return (
    <AccountShell>
      <div className="space-y-8">
        <PageHeader title="Wishlist" description="Treasures you've saved to come back to." />

        {isLoading || !ready ? (
          <PageSkeleton rows={4} />
        ) : !data || data.length === 0 ? (
          <StatePanel icon={Heart} title="No saved treasures yet" description="Tap the heart on any listing to keep it here for later." action={<Link href="/listings" className="inline-flex h-14 items-center rounded-full bg-primary px-8 font-semibold text-primary-foreground">Browse listings</Link>} />
        ) : (
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
            {data.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </AccountShell>
  );
}
