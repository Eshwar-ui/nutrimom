"use client";

import Link from "next/link";
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
import { cn } from "@/lib/utils";

const conditionTint: Record<string, string> = {
  NEW: "bg-sage text-[#2f5236]",
  LIKE_NEW: "bg-sky text-[#215172]",
  GOOD: "bg-blush text-[#7a2447]",
  FAIR: "bg-beige text-[#6b4a2a]",
};

export function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.some((i) => i.listingId === listing.id));
  const user = useAuthStore((s) => s.user);
  const wished = useWishlistStore((s) => s.ids.includes(listing.id));
  const toggleWish = useWishlistStore((s) => s.toggle);

  const isNew =
    Date.now() - new Date(listing.createdAt).getTime() < 14 * 864e5;
  const discount = listing.originalPriceInPaise
    ? Math.round(
        (1 - listing.sellingPriceInPaise / listing.originalPriceInPaise) * 100,
      )
    : 0;

  const heart = () => {
    if (!user) return router.push("/login?next=/listings");
    toggleWish(listing.id);
  };

  const add = () => {
    addItem({
      listingId: listing.id,
      title: listing.title,
      image: listing.images[0] ?? null,
      priceInPaise: listing.sellingPriceInPaise,
      city: listing.city,
      sellerName: listing.seller.name,
    });
    flyToCart(imgRef.current, listing.images[0] ?? null);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-border bg-surface card-shadow"
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
        {listing.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={listing.images[0]}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
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
          {isNew && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-[#5c4410]">
              Just in
            </span>
          )}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-foreground">
            {listing.title}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {listing.city}
          <span className="mx-1">·</span>
          <span className="inline-flex items-center gap-0.5">
            {listing.seller.name.split(" ")[0]}
            {listing.seller.isSellerVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            )}
          </span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-xl font-bold text-foreground">
            {formatPaise(listing.sellingPriceInPaise)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatPaise(listing.originalPriceInPaise!)}
              </span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                -{discount}%
              </span>
            </>
          )}
        </div>

        <button
          onClick={add}
          disabled={inCart}
          className={cn(
            "mt-4 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-70",
            inCart
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:brightness-110",
          )}
        >
          {inCart ? (
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
