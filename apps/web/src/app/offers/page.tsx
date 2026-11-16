import Image from "next/image";
import { ExternalLink, Gift, Info, Instagram, MessageCircle } from "lucide-react";
import type { PartnerOffer } from "@nutrimom/shared";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { TrackedExternalLink } from "@/components/tracked-link";
import { OfferCopyButton } from "@/components/offer-copy-button";
import { JsonLd } from "@/components/json-ld";
import { getPartnerOffers, getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { SOCIAL_LINKS, WHATSAPP_COMMUNITY_URL } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Exclusive Offers for Moms",
  description:
    "Verified discounts and coupon codes on baby, kids and maternity brands, shared with The Nurture Moms community. Copy a code and shop on the brand's own site.",
  path: "/offers",
});

// IST whatever the server's zone, so an offer valid until midnight in India
// never reads as a day early on a UTC render.
const fmtValidUntil = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

/**
 * Whether next/image may load this logo. It throws on a host outside
 * next.config's `images.remotePatterns`, which today is Supabase Storage's
 * public objects (what the admin uploader produces) — an admin can also paste
 * any https URL, and that one has to render as a plain <img> instead.
 */
function isOptimizableLogo(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".supabase.co") &&
      u.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

function OfferLogo({ offer }: { offer: PartnerOffer }) {
  // A white tile in both themes on purpose: brand logos are drawn for a light
  // background, and a dark-mode surface would swallow a dark wordmark.
  const tile =
    "relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-white";
  if (!offer.logoUrl) {
    return (
      <span aria-hidden className={cn(tile, "bg-sage/40 font-display text-2xl font-semibold text-sage-ink")}>
        {offer.brandName.trim().charAt(0).toUpperCase()}
      </span>
    );
  }
  if (isOptimizableLogo(offer.logoUrl)) {
    return (
      <span className={tile}>
        <Image
          src={offer.logoUrl}
          alt={`${offer.brandName} logo`}
          fill
          sizes="64px"
          className="object-contain p-1.5"
        />
      </span>
    );
  }
  return (
    <span className={tile}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a pasted logo URL outside images.remotePatterns; next/image would throw on it */}
      <img
        src={offer.logoUrl}
        alt={`${offer.brandName} logo`}
        loading="lazy"
        className="h-full w-full object-contain p-1.5"
      />
    </span>
  );
}

function OfferCard({ offer }: { offer: PartnerOffer }) {
  return (
    <article className="flex h-full flex-col rounded-card border border-border bg-surface p-6 card-shadow">
      <div className="flex items-start gap-4">
        <OfferLogo offer={offer} />
        <div className="min-w-0 flex-1 pt-1">
          <h2 className="font-display text-xl font-semibold leading-tight text-foreground">
            {offer.brandName}
          </h2>
          {offer.isAffiliate && (
            <span className="mt-2 inline-flex rounded-full bg-beige px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-beige-ink">
              Affiliate link
            </span>
          )}
        </div>
      </div>

      <p className="mt-5 rounded-2xl bg-accent/15 px-4 py-3 font-display text-lg font-semibold leading-snug text-accent-text">
        {offer.benefit}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{offer.description}</p>

      <div className="mt-auto pt-6">
        {offer.couponCode && (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-border-control bg-surface-2 py-2 pl-4 pr-2">
            <span className="min-w-0 flex-1">
              <span className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Coupon code
              </span>
              <code className="block truncate select-all font-mono text-base font-bold tracking-wider text-foreground">
                {offer.couponCode}
              </code>
            </span>
            <OfferCopyButton
              code={offer.couponCode}
              offerId={offer.id}
              brand={offer.brandName}
            />
          </div>
        )}
        <TrackedExternalLink
          event="offer_click"
          eventProps={{ offerId: offer.id, brand: offer.brandName, affiliate: offer.isAffiliate }}
          href={offer.url}
          target="_blank"
          rel={offer.isAffiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
          aria-label={`Shop Now at ${offer.brandName} (opens in a new tab)`}
          className={cn(buttonVariants(), "mt-3 w-full")}
        >
          Shop Now <ExternalLink className="h-4 w-4" aria-hidden />
        </TrackedExternalLink>
        {offer.expiresAt && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Valid until {fmtValidUntil(offer.expiresAt)}
          </p>
        )}
      </div>
    </article>
  );
}

/** Drops any offer whose expiry has passed since the API answered. */
function stillValid(offers: PartnerOffer[], now = new Date()): PartnerOffer[] {
  return offers.filter(
    (o) => !o.expiresAt || new Date(o.expiresAt).getTime() > now.getTime(),
  );
}

/**
 * Discounts / Exclusive Offers (brief §11, REDESIGN-PLAN Phase 4).
 *
 * Every offer is admin-entered and verified before it goes up; the API already
 * drops inactive and expired ones. A cached copy can outlive an offer by up to
 * the revalidate window, so expiry is checked again here — a coupon past its
 * date must never be shown as live. The `offers` revalidation scope purges
 * this page on every admin save.
 */
export default async function OffersPage() {
  const [allOffers, content] = await Promise.all([getPartnerOffers(), getSiteContent()]);
  const offers = stillValid(allOffers);
  const whatsappCommunity = content?.whatsappCommunityUrl || WHATSAPP_COMMUNITY_URL;
  const instagram = content?.instagramUrl || SOCIAL_LINKS.instagram;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Offers", path: "/offers" },
        ])}
      />
      <Container className="py-12 sm:py-16">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">
            Discounts · Exclusive offers
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
            Offers for our community
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Discounts that brands have shared with The Nurture Moms community —
            for baby, kids and maternity things you were going to buy anyway.
            Copy the code, shop on the brand&apos;s own site, and the saving is yours.
          </p>
        </header>

        {offers.length > 0 ? (
          <>
            <aside
              aria-label="About these offers"
              className="mt-8 flex max-w-3xl gap-3 rounded-card border border-border bg-surface-2 p-5 sm:p-6"
            >
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground">
                <strong className="font-semibold">About these offers.</strong>{" "}
                When we share affiliate links, we may earn a small commission if you buy — at
                no extra cost to you. Those are marked &ldquo;Affiliate link&rdquo;. We
                only list offers we&apos;ve verified.
              </p>
            </aside>

            <div className="mt-section grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </>
        ) : (
          <section className="mt-section rounded-panel border border-border bg-surface-2 px-6 py-12 text-center sm:px-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage/50 text-sage-ink">
              <Gift className="h-7 w-7" strokeWidth={1.7} aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              New offers are on their way
            </h2>
            <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted-foreground">
              There&apos;s nothing running just now. We share new discounts with the
              community first — join us on WhatsApp or follow along on Instagram and
              you&apos;ll hear when the next one lands.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={whatsappCommunity}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "lg" })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> Join the WhatsApp community
              </a>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <Instagram className="h-4 w-4" aria-hidden /> Follow on Instagram
              </a>
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
