"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Check, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatPaise, whatsappLink, type Listing, type SellerContact } from "@nutrimom/shared";
import { Button, buttonVariants } from "./ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { authedRequest } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { flyToCart } from "@/lib/fly-to-cart";
import { useAuthHydrated } from "@/lib/use-store-hydrated";
import { loginHref, takeIntentFromUrl, type AuthIntent } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

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
  const ensureSaved = useWishlistStore((s) => s.ensureSaved);
  const hydrated = useAuthHydrated();
  const [contacting, setContacting] = useState(false);
  // The seller's chat link, fetched for a "contact" resumed after sign-in.
  // Rendered as a plain link rather than opened: a window.open() that no
  // click started is a popup, and browsers block it.
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const whatsappLinkRef = useRef<HTMLAnchorElement>(null);
  const resumed = useRef(false);

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

  // Signed-out clicks go to sign-in and come back here with the action named,
  // so it happens instead of just landing the user on the page again.
  const signInTo = (intent: AuthIntent) =>
    router.push(loginHref(`/listings/${listing.id}`, intent));

  const heart = () => {
    if (!user) return signInTo("save");
    toggleWish(listing.id);
  };

  const addToBag = (target?: HTMLElement | null) => {
    addItem(snapshot);
    flyToCart(target ?? null, listing.images[0] ?? null);
  };

  const sellerFirstName = listing.seller.name.split(" ")[0];

  /** The seller's number is only released to signed-in buyers. */
  const fetchWhatsappUrl = async (): Promise<string | null> => {
    const { whatsappNumber } = await authedRequest<SellerContact>(
      `/listings/${listing.id}/contact`,
    );
    if (!whatsappNumber) return null;
    return whatsappLink(
      whatsappNumber,
      `Hi ${sellerFirstName}, is "${listing.title}" still available on The Nurture Moms?`,
    );
  };

  const chatOnWhatsapp = async () => {
    if (!user) return signInTo("contact");
    setContacting(true);
    try {
      const url = await fetchWhatsappUrl();
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Couldn't reach the seller right now — try again shortly.");
    } finally {
      setContacting(false);
    }
  };

  /*
    Resume the action that sent the user to sign in (`?intent=` — see
    lib/auth-redirect). Runs once per page view: the ref guards React's
    double-run effects, the parameter is stripped from the URL with
    history.replaceState (no history entry, no server re-render) so a refresh
    or Back can't repeat it, and "save" is ensure-saved, never a toggle.
  */
  useEffect(() => {
    if (!hydrated || resumed.current) return;
    const { pathname, search, hash } = window.location;
    const { intent, cleanUrl } = takeIntentFromUrl(pathname, search, hash);
    if (!cleanUrl) return;
    resumed.current = true;
    window.history.replaceState(null, "", cleanUrl);
    // An unknown intent, or a shared link opened while signed out: drop it.
    if (!intent || !user || sold) return;

    if (intent === "save") {
      ensureSaved(listing.id)
        .then(() => toast.success("Saved to your wishlist."))
        .catch(() => toast.error("Couldn't save this item — try again."));
      return;
    }
    if (intent === "contact" && listing.seller.hasWhatsapp) {
      const resume = async () => {
        setContacting(true);
        try {
          const url = await fetchWhatsappUrl();
          if (url) setWhatsappUrl(url);
        } catch {
          toast.error("Couldn't reach the seller right now — try again shortly.");
        } finally {
          setContacting(false);
        }
      };
      void resume();
    }
    // Runs on hydration only; the ref makes later dependency changes inert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Put the ready chat link where the user's attention (and keyboard) is.
  useEffect(() => {
    whatsappLinkRef.current?.focus();
  }, [whatsappUrl]);

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
        <p className="rounded-2xl bg-gold/20 px-4 py-3 text-sm font-medium text-gold-ink">
          Someone&apos;s completing checkout on this item right now — check back in a bit.
        </p>
      )}

      {/* Wraps to two full-width rows on the narrowest phones (320px), where
          two large buttons side by side ran off the screen. */}
      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          variant="outline"
          className="min-w-[9rem] flex-1"
          disabled={inCart || held}
          onClick={(e) => {
            addToBag(e.currentTarget);
          }}
        >
          {inCart ? <><Check className="h-5 w-5" /> In your bag</> : <><ShoppingBag className="h-5 w-5" /> Add to bag</>}
        </Button>
        <Button
          size="lg"
          className="min-w-[9rem] flex-1"
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
           built on cream and sage. */
        whatsappUrl ? (
          <a
            ref={whatsappLinkRef}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full hover:border-[#1da851]")}
          >
            <MessageCircle className="h-5 w-5 text-[#1da851]" />
            Open WhatsApp chat with {sellerFirstName}
          </a>
        ) : (
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
        )
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
