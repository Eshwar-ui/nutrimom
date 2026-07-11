"use client";

import Link from "next/link";
import { Trash2, ShoppingBag, MapPin } from "lucide-react";
import { formatPaise } from "@nutrimom/shared";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { Container, Card } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { useCartHydrated } from "@/lib/use-store-hydrated";

export default function CartPage() {
  const hydrated = useCartHydrated();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore(cartSubtotal);

  if (!hydrated) return <Container className="py-16"><PageSkeleton rows={2} /></Container>;

  if (items.length === 0) {
    return (
      <Container className="py-16 sm:py-24">
        <StatePanel
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Find a preloved treasure and it will wait here while you decide."
          action={<Link href="/listings" className="inline-flex h-14 items-center rounded-full bg-primary px-8 font-semibold text-primary-foreground">Browse listings</Link>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <h1 className="mb-8 font-display text-4xl font-semibold text-foreground">Your bag</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.listingId} className="flex gap-4 p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/listings/${item.listingId}`} className="font-display text-lg font-semibold leading-snug text-foreground hover:text-accent">
                    {item.title}
                  </Link>
                  <button aria-label="Remove" onClick={() => removeItem(item.listingId)} className="text-muted-foreground transition-colors hover:text-accent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {item.city} · {item.sellerName.split(" ")[0]}
                </span>
                <span className="mt-auto pt-3 text-lg font-bold text-foreground">
                  {formatPaise(item.priceInPaise)}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <Card className="h-fit p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-xl font-semibold text-foreground">Summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{items.length} item(s)</span>
            <span className="text-foreground">{formatPaise(subtotal)}</span>
          </div>
          <div className="my-4 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">{formatPaise(subtotal)}</span>
          </div>
          <Link href="/checkout" className={`${buttonVariants({ size: "lg" })} mt-6 w-full`}>Checkout</Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">Final availability and price are checked at checkout.</p>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Bag total</p><p className="text-lg font-bold text-foreground">{formatPaise(subtotal)}</p></div>
          <Link href="/checkout" className="inline-flex h-12 items-center rounded-full bg-primary px-7 font-semibold text-primary-foreground">Checkout</Link>
        </div>
      </div>
    </Container>
  );
}
