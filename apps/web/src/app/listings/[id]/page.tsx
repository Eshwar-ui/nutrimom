import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Truck,
  CalendarClock,
  Info,
  Store,
} from "lucide-react";
import {
  conditionLabels,
  deliveryLabels,
  formatPaise,
} from "@nutrimom/shared";
import { getListing } from "@/lib/listings";
import { ApiError } from "@/lib/api";
import { Container, Badge } from "@/components/ui/primitives";
import { ListingGallery } from "@/components/listing-gallery";
import { ListingActions } from "@/components/listing-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const l = await getListing(id);
    return { title: l.title, description: l.description.slice(0, 150) };
  } catch {
    return { title: "Listing" };
  }
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

  const discount = listing.originalPriceInPaise
    ? Math.round((1 - listing.sellingPriceInPaise / listing.originalPriceInPaise) * 100)
    : 0;

  const facts = [
    { icon: Info, label: "Condition", value: conditionLabels[listing.condition] },
    listing.usageDuration && { icon: CalendarClock, label: "Used for", value: listing.usageDuration },
    { icon: Truck, label: "Delivery", value: deliveryLabels[listing.deliveryOption] },
    { icon: MapPin, label: "Location", value: listing.city },
  ].filter(Boolean) as { icon: typeof Info; label: string; value: string }[];

  return (
    <Container className="pb-28 pt-8 sm:py-10 lg:pb-10">
      <Link href="/listings" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <ListingGallery images={listing.images} alt={listing.title} />

        <div className="lg:py-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/12 text-primary">Preloved</Badge>
            <Badge className="bg-accent/12 text-accent-text">{listing.category.name}</Badge>
          </div>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground">
            {listing.title}
          </h1>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatPaise(listing.sellingPriceInPaise)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPaise(listing.originalPriceInPaise!)}
                </span>
                <span className="mb-1 rounded-full bg-accent/15 px-2 py-0.5 text-sm font-bold text-accent-text">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-border bg-surface p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <f.icon className="h-3.5 w-3.5" /> {f.label}
                </span>
                <p className="mt-0.5 font-semibold text-foreground">{f.value}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{listing.description}</p>
          {listing.reasonForSelling && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why I&apos;m selling:</span>{" "}
              {listing.reasonForSelling}
            </p>
          )}

          {/* Seller */}
          <Link href={`/sellers/${listing.seller.id}`} className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-border bg-surface p-4 transition-transform hover:-translate-y-0.5">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/12 font-bold text-primary">
              {listing.seller.name[0]}
            </span>
            <div className="flex-1">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                {listing.seller.name}
                {listing.seller.isSellerVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </p>
              <p className="text-sm text-muted-foreground">
                {listing.seller.city ?? "Seller"} · View shop
              </p>
            </div>
            <Store className="h-5 w-5 text-muted-foreground" />
          </Link>

          <div className="mt-6">
            <ListingActions listing={listing} />
          </div>
        </div>
      </div>
    </Container>
  );
}
