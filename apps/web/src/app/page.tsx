import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarHeart } from "lucide-react";
import type { Category, Listing, SiteContent } from "@nutrimom/shared";
import { getCategories, getListings } from "@/lib/listings";
import { getBusinessProfile } from "@/lib/business-profile";
import { getServicePackages, getSiteContent, getTestimonials } from "@/lib/content";
import { isOptimizableImage } from "@/lib/content-image";
import { pageMetadata } from "@/lib/seo";
import { BOOK_SESSION_HREF, TRUST_LINE } from "@/lib/site-nav";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { HeroWave } from "@/components/section-wave";
import { ListingCard } from "@/components/listing-card";
import { StageSelector, FindYourVillage } from "@/components/home-pillars";
import { ServiceShowcase, BestValueTeaser } from "@/components/service-showcase";
import { TestimonialsSection } from "@/components/testimonials";
import { DecorativeElement } from "@/components/decorative-element";
import { TrackedLink } from "@/components/tracked-link";
import { cn } from "@/lib/utils";
import { ArtDirectedImage } from "@/components/art-directed-image";

/**
 * The brief's hero copy, word for word (§1). SiteContent carries the same text
 * as its defaults; these only show when the API can't be reached, so the home
 * page never falls back to placeholder words.
 */
const HERO_FALLBACK = {
  headline: "From pregnancy to toddlerhood, you’re not alone.",
  subline: "A nurturing space for every mother, every journey, and every stage.",
  message:
    "Move, nourish, connect and grow together. Find the support, guidance and community you need at every stage of motherhood.",
};

/** The section the hero's "Explore Services" button scrolls to. */
const SERVICES_ID = "services";

/**
 * The anchor of the price grid on /yoga (PackagePricing's default id). If the
 * yoga page renames it, the teaser still lands on the right page.
 */
const YOGA_PRICING_HREF = "/yoga#packages";

/** Small thumbnails for the category chips — the seeded category art. */
const categoryArt: Record<string, string> = {
  "baby-clothes": "/images/category-baby-clothes.webp",
  toys: "/images/category-toys.webp",
  strollers: "/images/category-strollers.webp",
  "car-seats": "/images/category-car-seats.webp",
  "high-chairs": "/images/category-high-chairs.webp",
};

export const metadata = pageMetadata({
  path: "/",
  absoluteTitle:
    "The Nurture Moms — Yoga, Nutrition, Community & Preloved for Indian Moms",
  description:
    "From pregnancy to toddlerhood, you’re not alone. Prenatal yoga & Garbhasanskar, mom & baby nutrition, a free mom community and a preloved marketplace.",
});

export default async function HomePage() {
  // Each read fails soft on its own, so one unreachable endpoint hides only
  // its own section rather than the page.
  const [businessProfile, content, testimonials, comboPackages, latest, categories] =
    await Promise.all([
      getBusinessProfile(),
      getSiteContent(),
      getTestimonials(),
      getServicePackages("COMBO"),
      // Newest approved first (the default sort) — every newly approved item
      // shows up here (roadmap #3).
      getListings({ pageSize: 4 })
        .then((r) => r.items)
        .catch((): Listing[] => []),
      getCategories().catch((): Category[] => []),
    ]);

  const hero = {
    headline: content?.heroHeadline?.trim() || HERO_FALLBACK.headline,
    subline: content?.heroSubline?.trim() || HERO_FALLBACK.subline,
    message: content?.heroMessage?.trim() || HERO_FALLBACK.message,
  };

  return (
    <>
      <JsonLd data={[organizationJsonLd(businessProfile), websiteJsonLd()]} />

      {content?.heroImageUrl ? (
        <PhotoHero hero={hero} content={content} />
      ) : (
        <IllustratedHero hero={hero} />
      )}

      {/* The four services, equal weight — the first thing under the hero, so
          what The Nurture Moms offers is clear before any product grid. */}
      <section id={SERVICES_ID} aria-labelledby="services-heading" className="scroll-mt-28">
        <Container className="pb-14 pt-10 sm:pt-14">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
              Our services
            </p>
            <h2
              id="services-heading"
              className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl"
            >
              Support for every stage of motherhood
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Four ways we&apos;re here for you — choose what you need today,
              and come back for the rest whenever you&apos;re ready.
            </p>
          </div>
          <div className="mt-10">
            <ServiceShowcase />
          </div>
          <BestValueTeaser packages={comboPackages} href={YOGA_PRICING_HREF} />
        </Container>
      </section>

      <Reveal className="w-full">
        <StageSelector />
      </Reveal>

      <TestimonialsSection testimonials={testimonials} className="bg-surface-2" />

      {/* The marketplace, kept compact so it's one service among four:
          newest listings (roadmap #3) and the category shortcuts. */}
      {(latest.length > 0 || categories.length > 0) && (
        <section aria-labelledby="latest-heading" className="relative">
          <Container className="py-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
                  Preloved Marketplace
                </p>
                <h2
                  id="latest-heading"
                  className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl"
                >
                  Latest listings
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Gently used baby, kids and maternity items from other
                  mothers. We check every listing before it goes live.
                </p>
              </div>
              <TrackedLink
                event="preloved_click"
                eventProps={{ action: "shop", placement: "home_latest" }}
                href="/listings"
                className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
              >
                Shop Preloved <ArrowRight className="h-4 w-4" aria-hidden />
              </TrackedLink>
            </div>

            {categories.length > 0 && (
              <nav aria-label="Shop by category" className="mt-8">
                <ul className="flex flex-wrap gap-2">
                  {categories.slice(0, 10).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/categories/${c.slug}`}
                        className={cn(
                          "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface text-sm font-semibold text-foreground transition-colors hover:border-primary/45 hover:bg-muted",
                          categoryArt[c.slug] ? "py-1 pl-1 pr-4" : "px-4",
                        )}
                      >
                        {categoryArt[c.slug] && (
                          <Image
                            src={categoryArt[c.slug]}
                            alt=""
                            width={64}
                            height={64}
                            className="h-9 w-9 rounded-full bg-cream object-contain p-0.5"
                          />
                        )}
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {latest.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {latest.map((l, i) => (
                  <Reveal key={l.id} delay={(i % 4) * 0.05}>
                    <ListingCard listing={l} />
                  </Reveal>
                ))}
              </div>
            )}

            <p className="mt-8 text-sm text-muted-foreground">
              New to preloved?{" "}
              <Link
                href="/preloved#how-it-works"
                className="font-bold text-accent-text underline-offset-4 hover:underline"
              >
                See how buying, selling and donating work
              </Link>
              .
            </p>
          </Container>
        </section>
      )}

      {/* Closing band — the page ends on the whole community, not on the
          marketplace above it. */}
      <Reveal className="w-full">
        <FindYourVillage />
      </Reveal>
    </>
  );
}

type HeroText = { headline: string; subline: string; message: string };

/**
 * Today's illustrated banner — used until the admin uploads a genuine photo
 * (SiteContent.heroImageUrl). The copy sits in the artwork's empty column:
 * the top band on the tall phone crop, the left column on tablet/desktop.
 * The longer supporting message only fits there from `xl`, so below that it
 * runs directly under the banner instead.
 */
function IllustratedHero({ hero }: { hero: HeroText }) {
  return (
    <>
      {/* Pulled up so the transparent nav floats over the artwork. */}
      <section className="relative -mt-16">
        <ArtDirectedImage
          alt="Illustration of a smiling mother holding her baby"
          desktop={{ src: "/images/nutrimom-playful-mama-banner-extended.webp", width: 1536, height: 1024 }}
          tablet={{ src: "/hero-images/bg-tablet.webp", width: 1448, height: 1086 }}
          mobile={{ src: "/hero-images/bg-mobile.webp", width: 863, height: 1823 }}
          eager
          className="block h-auto w-full"
        />
        {/* Soft top fade so the transparent nav has a legible backdrop. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-0 mx-auto flex w-full max-w-7xl items-start px-5 pt-20 sm:px-8 sm:pt-24 md:items-center md:pt-0 lg:items-start lg:pl-24 lg:pr-10 lg:pt-[max(112px,9vw)]">
          <HeroCopy hero={hero} variant="overlay" />
        </div>
        <HeroWave />
      </section>
      <Container className="pt-6 xl:hidden">
        <p className="max-w-2xl text-lg leading-relaxed text-foreground">
          {hero.message}
        </p>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">{TRUST_LINE}</p>
      </Container>
    </>
  );
}

/**
 * The genuine photo the brief asks for, once the admin has uploaded one.
 * An uploaded photo has no reserved empty column for text, so the copy sits
 * beside it rather than on top — it stays readable whatever the picture.
 */
function PhotoHero({ hero, content }: { hero: HeroText; content: SiteContent }) {
  const src = content.heroImageUrl!;
  return (
    <section className="relative -mt-16 overflow-hidden bg-surface-2/70 pt-16">
      <DecorativeElement
        src="/images/bg-element-leaf-sprig.webp"
        className="-left-10 bottom-10 hidden w-40 -rotate-12 opacity-40 lg:block"
      />
      <Container className="relative grid items-center gap-6 pb-20 pt-6 sm:gap-8 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24 lg:pt-16">
        <HeroCopy hero={hero} variant="split" />
        {/* First on a phone, so the photo is in the opening screen. */}
        <div className="relative order-first aspect-[4/3] overflow-hidden rounded-panel bg-surface shadow-pop lg:order-none lg:aspect-square">
          <Image
            src={src}
            alt={content.heroImageAlt?.trim() || "A mother with her little one"}
            fill
            preload
            unoptimized={!isOptimizableImage(src)}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
      </Container>
      <HeroWave />
    </section>
  );
}

/**
 * On the illustrated banner the copy has a fixed height budget on a phone, so
 * the buttons shed their icons and padding to stay on one line at 375px.
 */
const OVERLAY_BUTTON =
  "h-10 px-4 text-[13px] sm:h-11 sm:px-6 sm:text-sm xl:h-14 xl:px-8 xl:text-base";

/** Beside a photo there's room, but two lg buttons still don't fit at 375px. */
const SPLIT_BUTTON = "h-11 px-5 text-sm sm:h-14 sm:px-8 sm:text-base";

function HeroCopy({
  hero,
  variant,
}: {
  hero: HeroText;
  variant: "overlay" | "split";
}) {
  const overlay = variant === "overlay";
  return (
    // On the banner the copy must stay inside the artwork's empty left
    // column, which is ~45% of the viewport minus the left inset.
    <div className={cn("w-full min-w-0", overlay ? "max-w-sm md:max-w-[20rem] lg:max-w-[calc(45vw-6rem)] xl:max-w-[min(36rem,calc(48vw-6rem))]" : "max-w-xl")}>
      <h1
        className={cn(
          "font-display font-semibold tracking-tight text-foreground",
          overlay
            ? "text-[clamp(1.6rem,0.7rem_+_4.4vw,2.75rem)] md:text-[clamp(1.6rem,1rem_+_2vw,2.1rem)] lg:text-[clamp(2rem,0.5rem_+_2.6vw,3.4rem)]"
            : "text-[2.4rem] sm:text-5xl lg:text-[3.5rem]",
          // After the sizes: tailwind-merge drops a leading-* that precedes a text-* size.
          "leading-[1.08]",
        )}
      >
        {hero.headline}
      </h1>
      <p
        className={cn(
          "font-semibold text-foreground/85",
          overlay
            ? "mt-3 text-[clamp(0.95rem,0.8rem_+_0.6vw,1.2rem)] leading-snug sm:mt-5 md:text-base lg:text-lg xl:text-xl"
            : "mt-5 text-xl leading-snug",
        )}
      >
        {hero.subline}
      </p>
      <p
        className={cn(
          "text-muted-foreground",
          overlay ? "mt-4 hidden max-w-lg text-lg xl:block" : "mt-4 text-lg",
          "leading-relaxed",
        )}
      >
        {hero.message}
      </p>
      <div className={cn("flex flex-wrap items-center gap-2 sm:gap-3", overlay ? "mt-5 sm:mt-7" : "mt-8")}>
        <Link
          href={`#${SERVICES_ID}`}
          className={cn(buttonVariants({ size: overlay ? "md" : "lg" }), overlay ? OVERLAY_BUTTON : SPLIT_BUTTON)}
        >
          Explore Services <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden />
        </Link>
        <Link
          href={BOOK_SESSION_HREF}
          className={cn(buttonVariants({ size: overlay ? "md" : "lg", variant: "outline" }), overlay ? OVERLAY_BUTTON : SPLIT_BUTTON)}
        >
          <CalendarHeart className="hidden h-4 w-4 sm:block" aria-hidden /> Book a Session
        </Link>
      </div>
      {/* The brief's trust line. On the banner it only fits from `xl`; below
          that it runs under the banner with the supporting message. */}
      <p className={cn("text-sm font-semibold text-muted-foreground", overlay ? "mt-8 hidden xl:block" : "mt-8")}>
        {TRUST_LINE}
      </p>
    </div>
  );
}
