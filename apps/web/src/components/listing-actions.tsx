"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Check, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatPaise, whatsappLink, type Listing, type SellerContact } from "@nutrimom/shared";
import { Button } from "./ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { authedRequest } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { flyToCart } from "@/lib/fly-to-cart";

/* WhatsApp's brand green, darkened from the #25D366 of their own UI so it holds
   contrast as a glyph on this site's cream surface and stays visible on the
   dark one. Written as a literal in the classes below rather than a constant or
   a CSS variable: Tailwind reads class names statically, so only a literal
   compiles. (`border-[--var]` was the v3 shorthand and silently emits
   `border-color: --var` — no `var()`, no rule — under v4.) */

export function ListingActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.some((i) => i.listingId === listing.id));
  const wished = useWishlistStore((s) => s.ids.includes(listing.id));
  const toggleWish = useWishlistStore((s) => s.toggle);
  const [contacting, setContacting] = useState(false);

  const sold = listing.status === "SOLD";
  // A buyer's checkout hold on this listing — not purchasable by anyone
  // else until it either sells or the hold expires and frees it back up.
  const held = listing.status === "RESERVED";

  const snapshot = {
    listingId: listing.id,
    title: listing.title,
    image: listing.images[0] ?? null,
    priceInPaise: listing.sellingPriceInPaise,
    city: listing.city,
    sellerName: listing.seller.name,
  };

  const heart = () => {
    if (!user) return router.push(`/login?next=/listings/${listing.id}`);
    toggleWish(listing.id);
  };

  const addToBag = (target?: HTMLElement | null) => {
    addItem(snapshot);
    flyToCart(target ?? null, listing.images[0] ?? null);
  };

  const chatOnWhatsapp = async () => {
    if (!user) return router.push(`/login?next=/listings/${listing.id}`);
    setContacting(true);
    try {
      const { whatsappNumber } = await authedRequest<SellerContact>(
        `/listings/${listing.id}/contact`,
      );
      if (!whatsappNumber) return;
      window.open(
        whatsappLink(
          whatsappNumber,
          `Hi ${listing.seller.name.split(" ")[0]}, is "${listing.title}" still available on The Nurture Moms?`,
        ),
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      toast.error("Couldn't reach the seller right now — try again shortly.");
    } finally {
      setContacting(false);
    }
  };

  if (sold) {
    return (
      <div className="rounded-2xl bg-muted px-5 py-4 text-center font-bold text-muted-foreground">
        This treasure has found its new home.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {held && (
        <p className="rounded-2xl bg-gold/20 px-4 py-3 text-sm font-medium text-[#5c4410]">
          Someone&apos;s completing checkout on this item right now — check back in a bit.
        </p>
      )}

      <div className="flex gap-3">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          disabled={inCart || held}
          onClick={(e) => {
            addToBag(e.currentTarget);
          }}
        >
          {inCart ? <><Check className="h-5 w-5" /> In your bag</> : <><ShoppingBag className="h-5 w-5" /> Add to bag</>}
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={held}
          onClick={() => {
            addItem(snapshot);
            router.push("/checkout");
          }}
        >
          Buy now
        </Button>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" size="lg" className="flex-1 border-2 border-border" onClick={heart}>
          <motion.span
            animate={wished ? { scale: [1, 1.5, 0.85, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="inline-flex"
          >
            <Heart className={wished ? "h-5 w-5 fill-accent text-accent" : "h-5 w-5"} />
          </motion.span>
          {wished ? "Saved" : "Save"}
        </Button>
      </div>

      {listing.seller.hasWhatsapp && (
        /* Built on the shared Button rather than a hand-rolled one, which is
           what this was: a raw <button> on a #25D366 slab, with no focus ring,
           no hover, and — because form controls size to fit — narrower than the
           Save row above it.

           It is the third action here, under "Buy now" and "Add to bag", so it
           takes the same subordinate outline the Save button uses. The WhatsApp
           green survives on the glyph, where it still identifies the channel
           without a saturated slab competing with the primary CTA in a palette
           built on cream and forest green. */
        <Button
          variant="outline"
          size="lg"
          className="w-full hover:border-[#1da851]"
          onClick={() => void chatOnWhatsapp()}
          disabled={contacting}
        >
          <MessageCircle className="h-5 w-5 text-[#1da851]" />
          {contacting ? "Opening…" : "Chat with seller on WhatsApp"}
        </Button>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{held ? "Checkout in progress" : "One available"}</p>
            <p className="text-lg font-bold text-foreground">{formatPaise(listing.sellingPriceInPaise)}</p>
          </div>
          <Button variant="outline" className="px-5" disabled={inCart || held} onClick={(event) => addToBag(event.currentTarget)}>
            {inCart ? "In bag" : "Add"}
          </Button>
          <Button className="px-6" disabled={held} onClick={() => { addItem(snapshot); router.push("/checkout"); }}>Buy now</Button>
        </div>
      </div>
    </div>
  );
}
