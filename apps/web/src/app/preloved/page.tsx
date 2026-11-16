import Link from "next/link";
import { TrackedLink } from "@/components/tracked-link";
import { ShoppingBag, Tag, Gift, ShieldCheck, Leaf, ArrowRight } from "lucide-react";
import type { Category, Listing } from "@nutrimom/shared";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import {
  ServiceHero,
  OfferingGrid,
  ClosingCta,
  type Offering,
} from "@/components/service-sections";
import { ListingCard } from "@/components/listing-card";
import { Reveal } from "@/components/reveal";
import { PrelovedHowItWorks } from "@/components/preloved-guide";
import { getCategories, getListings } from "@/lib/listings";
import { getCancellationPolicy, getCommissionBps } from "@/lib/marketplace-policy";
import { SERVICE_OG_IMAGES, pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { cn } from "@/lib/utils";

/**
 * The Preloved pillar's landing page.
 *
 * Deliberately a hub *above* the marketplace rather than a replacement for it:
 * /listings, /categories/* and /sell keep their URLs, their rankings and their
 * live orders. This page exists so the fourth pillar has something to rank for
 * and somewhere to carry the buy / sell / donate framing that a product grid
 * can't.
 */
export const metadata = pageMetadata({
  title: "Preloved Marketplace",
  description:
    "Loved before, loved again. Buy, sell or donate gently used baby, kids and maternity essentials with verified moms across India, with secure online payment.",
  path: "/preloved",
  images: [SERVICE_OG_IMAGES.preloved],
});

const ways: Offering[] = [
  {
    icon: ShoppingBag,
    tint: "bg-blush/60",
    title: "Shop preloved",
    body: "Browse gently used strollers, carriers, clothes, toys and maternity wear from local families at a fraction of retail.",
    href: "/listings",
  },
  {
    icon: Tag,
    tint: "bg-sage/60",
    title: "Sell what you've outgrown",
    body: "Photograph it, set your price, and give your baby gear a second home. We take the payment for you and give you a printable address label.",
    href: "/sell",
  },
  {
    icon: Gift,
    tint: "bg-sky/60",
    title: "Or pass it on",
    body: "Donate what you no longer need to another mom who'll treasure it just as much as you did.",
    href: "/preloved/donate",
  },
];

export default async function PrelovedPage() {
  // Each read fails soft on its own — the hub still explains the pillar and
  // links into it when the API is unreachable.
  const [latest, categories, policy, commissionBps] = await Promise.all([
    getListings({ pageSize: 8 })
      .then((r) => r.items)
      .catch((): Listing[] => []),
    getCategories().catch((): Category[] => []),
    getCancellationPolicy(),
    getCommissionBps(),
  ]);

  return (
    <>
      {/* Breadcrumb only. The marketplace's machine-readable substance is the
          Product + Offer node on each listing; a Service node here would
          restate that vaguely and compete with the pages that carry it. */}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Preloved", path: "/preloved" },
        ])}
      />
      <Container className="py-12 sm:py-16">
      <ServiceHero
        eyebrow="Pass it on"
        title="Loved before. Loved again."
        subtitle="Give useful baby and maternity essentials another loving chapter — and find what your family needs next without paying retail for it."
      >
        <TrackedLink
          event="preloved_click"
          eventProps={{ action: "shop", placement: "hero" }}
          href="/listings"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden /> Shop Preloved
        </TrackedLink>
        <TrackedLink
          event="preloved_click"
          eventProps={{ action: "sell", placement: "hero" }}
          href="/sell"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
        >
          <Tag className="h-4 w-4" aria-hidden /> Sell an Item
        </TrackedLink>
        <TrackedLink
          event="preloved_click"
          eventProps={{ action: "donate", placement: "hero" }}
          href="/preloved/donate"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "gap-2")}
        >
          <Gift className="h-4 w-4" aria-hidden /> Donate an Item
        </TrackedLink>
      </ServiceHero>

      <OfferingGrid heading="Three ways to take part" items={ways} />

      <PrelovedHowItWorks policy={policy} commissionBps={commissionBps} />

      <section className="mt-14 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-display text-lg font-semibold text-foreground">
            Checked before it goes live
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We check every listing before it appears, we approve every seller,
            and you pay online through a secure payment page — so your order is
            confirmed the moment the payment goes through.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Leaf className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-display text-lg font-semibold text-foreground">
            Motherhood doesn&apos;t have to cost a fortune
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Babies outgrow things long before those things wear out. Passing
            them on is the practical choice and the kinder one — for your budget
            and for everything that would otherwise be thrown away.
          </p>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Browse by category
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Latest listings
            </h2>
            <Link
              href="/listings"
              className="-my-2 inline-flex shrink-0 items-center gap-1.5 py-2 text-sm font-semibold text-accent-text hover:underline"
            >
              Shop Preloved <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {latest.map((listing, i) => (
              <Reveal key={listing.id} delay={i * 0.04}>
                <ListingCard listing={listing} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <ClosingCta
        title="Have something to pass on?"
        body="List it in a few minutes. Another mom is already looking for it."
        decorations={[
          {
            src: "/images/category-baby-clothes.webp",
            className: "-left-20 -top-16 w-60 -rotate-12",
          },
          {
            src: "/images/category-strollers.webp",
            className: "-right-20 -top-16 w-100 rotate-12",
          },
          {
            src: "/images/category-toys.webp",
            className: "-bottom-20 left-40 w-64 -rotate-20",
          },
        ]}
      >
        <TrackedLink
          event="preloved_click"
          eventProps={{ action: "sell", placement: "closing" }}
          href="/sell"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <Tag className="h-4 w-4" aria-hidden /> Sell an Item
        </TrackedLink>
        <Link
          href="#how-it-works"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          How It Works
        </Link>
      </ClosingCta>
      </Container>
    </>
  );
}
