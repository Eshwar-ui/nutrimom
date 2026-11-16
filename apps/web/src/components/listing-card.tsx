"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, BadgeCheck, ShoppingBag, Check } from "lucide-react";
import { conditionLabels, formatPaise, type Listing } from "@nutrimom/shared";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { flyToCart } from "@/lib/fly-to-cart";
import { getListingImageSources } from "@/lib/listing-image";
import { cn } from "@/lib/utils";
import { loginHref } from "@/lib/auth-redirect";
import { buttonVariants } from "@/components/ui/button";
import { listingPlace } from "@/lib/listing-place";

const conditionTint: Record<string, string> = {
  NEW: "bg-sage text-sage-ink",
  LIKE_NEW: "bg-sky text-sky-ink",
  GOOD: "bg-blush text-blush-ink",
  FAIR: "bg-beige text-beige-ink",
};

export function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.some((i) => i.listingId === listing.id));
  const user = useAuthStore((s) => s.user);
  const wished = useWishlistStore((s) => s.ids.includes(listing.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const [image] = getListingImageSources(listing.images);

  const discount = listing.originalPriceInPaise
    ? Math.round(
        (1 - listing.sellingPriceInPaise / listing.originalPriceInPaise) * 100,
      )
    : 0;

  const sold = listing.status === "SOLD";
  const held = listing.status === "RESERVED";
  const unavailable = sold || held;

  const heart = () => {
    // Back to this item's page with the save pending, not to the shop grid
    // the user would have to find it in again.
    if (!user) return router.push(loginHref(`/listings/${listing.id}`, "save"));
    toggleWish(listing.id);
  };

  const add = () => {
    addItem({
      listingId: listing.id,
      title: listing.title,
      image,
      priceInPaise: listing.sellingPriceInPaise,
      city: listing.city,
      sellerName: listing.seller.name,
    });
    flyToCart(imgRef.current, image);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-card border-2 border-border bg-surface card-shadow"
    >
      {/* Preloved sticker — wobbles on card hover */}
      <span className="pointer-events-none absolute left-3 top-3 z-10 -rotate-[8deg] rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-md group-hover:animate-[sticker-wobble_0.5s_ease-in-out]">
        Preloved
      </span>

      <WishlistButton
        wished={wished}
        onToggle={heart}
        className="absolute right-3 top-3 z-10"
      />

      <Link href={`/listings/${listing.id}`} className="relative block aspect-square overflow-hidden bg-muted">
        <Image
          ref={imgRef}
          src={image}
          alt={listing.title}
          fill
          sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 90vw"
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-[1.06]",
            unavailable && "opacity-60 grayscale",
          )}
        />
        {unavailable && (
          <span className="absolute inset-0 grid place-items-center bg-black/10">
            <span className="rounded-full bg-foreground/85 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-background">
              {sold ? "Sold" : "Reserved"}
            </span>
          </span>
        )}
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold",
              conditionTint[listing.condition],
            )}
          >
            {conditionLabels[listing.condition]}
          </span>
        </span>
      </Link>

      <div className="min-w-0 flex flex-1 flex-col overflow-hidden p-4">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-foreground">
            {listing.title}
          </h3>
        </Link>

        <div className="mt-1.5 flex min-w-0 items-center gap-1 overflow-hidden text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {/* Area only — the PIN is never part of the public listing. */}
          <span className="truncate">{listingPlace(listing)}</span>
          <span className="mx-1">·</span>
          <span className="inline-flex items-center gap-0.5">
            {listing.seller.name.split(" ")[0]}
            {listing.seller.isSellerVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            )}
          </span>
        </div>

        <div className="mt-3 flex min-w-0 items-end gap-2">
          <span className="text-lg font-bold text-foreground sm:text-xl">
            {formatPaise(listing.sellingPriceInPaise)}
          </span>
          {discount > 0 && (
            <>
              <span className="hidden text-sm text-muted-foreground line-through sm:inline">
                {formatPaise(listing.originalPriceInPaise!)}
              </span>
              <span className="hidden rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent-text sm:inline">
                -{discount}%
              </span>
            </>
          )}
        </div>

        <button
          onClick={add}
          disabled={inCart || unavailable}
          className={cn(
            buttonVariants(),
            "mt-4 w-full",
            (inCart || unavailable) &&
              "bg-muted text-muted-foreground shadow-none disabled:opacity-100",
          )}
        >
          {unavailable ? (
            sold ? "Sold" : "Reserved"
          ) : inCart ? (
            <>
              <Check className="h-4 w-4" /> In your bag
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Add to bag
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
