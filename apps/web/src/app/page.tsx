import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  Gift,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { MEMBERSHIP_PLANS, formatPaise, type Category, type Listing } from "@nutrimom/shared";
import { getCategories, getListings } from "@/lib/listings";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Playful } from "@/components/ui/playful";
import { Reveal } from "@/components/reveal";
import { HeroWave } from "@/components/section-wave";
import { ListingCard } from "@/components/listing-card";
import {
  ShopYourWay,
  TrustSafety,
  Testimonials,
} from "@/components/home-sections";
import { Newsletter } from "@/components/newsletter";
import { JourneyLine } from "@/components/journey-line";
import { DecorativeElement } from "@/components/decorative-element";
import { PlayfulBackground } from "@/components/playful-background";
import { cn } from "@/lib/utils";

const chipTints = [
  "bg-blush/70 text-[#7a2447]",
  "bg-sage/70 text-[#2f5236]",
  "bg-sky/70 text-[#215172]",
  "bg-lavender/70 text-[#4a3170]",
  "bg-beige text-[#6b4a2a]",
];

// Punchy leading dots for the category rail — cycle warm/brand tones.
const dotColors = ["bg-accent", "bg-gold", "bg-primary"];

const categoryArt: Record<string, string> = {
  "baby-clothes": "/images/category-baby-clothes.png",
  toys: "/images/category-toys.png",
  strollers: "/images/category-strollers.png",
  "car-seats": "/images/category-car-seats.png",
  "high-chairs": "/images/category-high-chairs.png",
};

const steps = [
  {
    icon: ShoppingBag,
    tint: "bg-blush/60",
    title: "Shop preloved",
    body: "Browse gently used pieces from local families at a fraction of retail.",
    offset: "md:-translate-y-3",
  },
  {
    icon: Tag,
    tint: "bg-sage/60",
    title: "Sell your outgrown",
    body: "Snap a few photos, set your price, and give your baby gear a second home.",
    offset: "md:translate-y-5",
  },
  {
    icon: Gift,
    tint: "bg-sky/60",
    title: "Or pass it on",
    body: "Donate what you no longer need to another mom who'll treasure it.",
    offset: "md:-translate-y-3",
  },
];

export default async function HomePage() {
  let featured: Listing[] = [];
  let latest: Listing[] = [];
  let categories: Category[] = [];
  try {
    const [f, latestRes, cats] = await Promise.all([
      getListings({ featured: true, pageSize: 8 }),
      getListings({ pageSize: 8 }), // newest approved first (default sort)
      getCategories(),
    ]);
    featured = f.items;
    latest = latestRes.items;
    if (featured.length === 0) featured = latest;
    categories = cats;
  } catch {
    // API/DB not running yet — render the shell.
  }

  const visualCategories = categories
    .filter((c) => categoryArt[c.slug])
    .slice(0, 5);
  const extraCategories = categories
    .filter((c) => !categoryArt[c.slug])
    .slice(0, 12);

  return (
    <>
      {/* Hero — full image; pulled up so the transparent nav floats over it. */}
      <section className="relative -mt-16">
        <picture>
          <source media="(min-width: 1024px)" srcSet="/images/nutrimom-playful-mama-banner-extended.png" />
          <source media="(min-width: 768px)" srcSet="/hero-images/bg-tablet.png" />
          <img
            src="/hero-images/bg-mobile.png"
            alt="Moms sharing preloved baby essentials"
            className="block w-full"
          />
        </picture>
        {/* Soft top fade — background colour bleeding into the image so the
            transparent nav has a legible, seamless backdrop. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
        {/* Copy sits in each image's empty space — top on the tall mobile
            crop, left column on tablet/desktop's wide crops. Desktop is
            top-anchored (not centered) since the wide banner's empty
            column runs the full height — centering pushed it below the
            fold on tall/wide viewports. */}
        <div className="absolute inset-0 mx-auto flex w-full max-w-7xl items-start px-5 pt-20 sm:px-8 sm:pt-24 md:items-center md:pt-0 lg:items-start lg:pl-24 lg:pr-10 lg:pt-[max(112px,11vw)]">
          <HeroCopy />
        </div>
        {/* Wavy, shadowed base — turns the image's hard bottom into a soft edge. */}
        <DecorativeElement
          src="/images/bg-element-sun-doodle.png"
          className="left-8 top-28 hidden w-20 opacity-80 lg:block"
        />
        <DecorativeElement
          src="/images/bg-element-doodle-cluster.png"
          className="bottom-16 left-[28%] hidden w-28 -rotate-12 opacity-65 xl:block"
        />
        <HeroWave />
      </section>

      {/* Category tiles — plain shared cream, tucked up under the banner so the
          seam is cream-on-cream and disappears. */}
      {categories.length > 0 && (
        <section className="relative isolate -mt-8 overflow-hidden bg-background pt-8">
          <PlayfulBackground variant="market" />
          <DecorativeElement
            src="/images/bg-element-leaf-sprig.png"
            className="-left-16 top-16 hidden w-48 -rotate-12 opacity-35 sm:block"
          />
          <DecorativeElement
            src="/images/bg-element-toy-accent.png"
            className="-right-10 top-20 hidden w-32 rotate-6 opacity-40 md:block"
          />
          <DecorativeElement
            src="/images/bg-element-peach-onesie.png"
            className="bottom-8 right-[9%] hidden w-28 -rotate-6 opacity-35 lg:block"
          />
          <Container className="relative z-[1] pb-16 pt-10">
            <CategoryTiles visual={visualCategories} extra={extraCategories} />
          </Container>
        </section>
      )}

      {/* Shop your way — functional catalog entry points (budget, condition, search) */}
      <ShopYourWay />

      {/* Featured */}
      <section className="relative isolate overflow-hidden">
        <PlayfulBackground variant="fresh" />
        <DecorativeElement
          src="/images/bg-element-blush-swash.png"
          className="-left-44 top-2 hidden w-[38rem] opacity-25 lg:block"
        />
        <DecorativeElement
          src="/images/bg-element-dotted-trail.png"
          className="-right-24 bottom-4 hidden w-[28rem] opacity-35 xl:block"
        />
        <DecorativeElement
          src="/images/bg-element-folded-clothes.png"
          className="right-[5%] top-8 hidden w-32 rotate-3 opacity-30 lg:block"
        />
        <Container className="relative z-[1] py-14">
          {categories.length > 0 && (
            <nav
              aria-label="Browse by category"
              className="mb-8 -mt-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
            >
              <ul className="flex w-max animate-[marquee_30s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
                {[...categories, ...categories].map((c, i) => {
                  const dupe = i >= categories.length;
                  return (
                    <li key={i} aria-hidden={dupe || undefined}>
                      <Link
                        href={`/listings?category=${c.slug}`}
                        tabIndex={dupe ? -1 : undefined}
                        className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-border bg-surface/70 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-[transform,color,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-surface hover:text-foreground"
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-150", dotColors[i % dotColors.length])} />
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          <div className="mb-9 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
                Fresh finds
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Just dropped by our moms
              </h2>
            </div>
            <Playful className="hidden sm:inline-flex">
              <Link
                href="/listings"
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
              >
                See everything <ArrowRight className="h-4 w-4" />
              </Link>
            </Playful>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featured.map((l, i) => (
                <Reveal key={l.id} delay={(i % 4) * 0.06}>
                  <ListingCard listing={l} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-border p-14 text-center text-muted-foreground">
              New treasures are on their way — check back soon.
            </div>
          )}
        </Container>
      </section>

      {/* Latest listings — every newly approved item shows up here */}
      {latest.length > 0 && (
        <section className="relative">
          <Container className="py-14">
            <div className="mb-9 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
                  Latest listings
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
                  New this week
                </h2>
              </div>
              <Playful className="hidden sm:inline-flex">
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
                >
                  See everything <ArrowRight className="h-4 w-4" />
                </Link>
              </Playful>
            </div>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {latest.map((l, i) => (
                <Reveal key={l.id} delay={(i % 4) * 0.06}>
                  <ListingCard listing={l} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* How it works */}
      <section className="relative overflow-hidden">
        <DecorativeElement
          src="/images/bg-element-dotted-trail.png"
          className="left-[8%] top-28 hidden w-[30rem] -rotate-6 opacity-30 lg:block"
        />
        <DecorativeElement
          src="/images/bg-element-leaf-sprig.png"
          className="-right-12 bottom-0 hidden w-52 rotate-12 opacity-30 md:block"
        />
        <DecorativeElement
          src="/images/bg-element-sage-pram.png"
          className="-left-8 bottom-10 hidden w-40 -rotate-3 opacity-25 xl:block"
        />
        <Container className="relative py-14">
          <div className="mb-8 overflow-hidden rounded-[2rem] border-2 border-border bg-surface card-shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/marketplace-benefits-banner.png"
              alt="Benefits of buying and selling preloved baby items"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {/* Hand-drawn route threads the three steps into one journey —
                draws itself in on scroll instead of a stiff straight rule. */}
            <JourneyLine />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08} className={s.offset}>
                <div className="relative flex flex-col items-center px-2 text-center md:items-start md:text-left">
                  <span
                    className={`relative z-10 grid h-14 w-14 place-items-center rounded-2xl ring-8 ring-background ${s.tint}`}
                  >
                    <s.icon className="h-6 w-6 text-foreground/70" strokeWidth={1.6} />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Trust & safety — buyer protection */}
      <TrustSafety />

      {/* Social proof */}
      <Testimonials />

      {/* CTA band */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <PlayfulBackground variant="cta" />
        <DecorativeElement
          src="/images/bg-element-blush-swash.png"
          className="-left-40 -top-20 w-[34rem] opacity-20"
        />
        <DecorativeElement
          src="/images/bg-element-toy-accent.png"
          className="right-8 top-5 hidden w-24 opacity-60 sm:block"
        />
        <DecorativeElement
          src="/images/bg-element-gift-box.png"
          className="bottom-3 right-[22%] hidden w-28 rotate-6 opacity-25 lg:block"
        />
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <Container className="relative z-[1] grid gap-8 py-16 md:grid-cols-[2fr_auto_1fr] md:items-center">
          <h2 className="font-display text-3xl font-semibold leading-tight text-primary-foreground md:text-4xl">
            Got outgrown gear gathering dust? Turn it into someone&apos;s
            treasure.
          </h2>
          {/* Ticket-stub perforation between the pitch and the CTA. */}
          <div
            aria-hidden
            className="hidden h-24 border-l-2 border-dashed border-primary-foreground/25 md:block"
          />
          <div className="relative md:justify-self-end">
            <span className="absolute -right-3 -top-6 -rotate-6 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#5c4410] shadow-md">
              Membership from {formatPaise(MEMBERSHIP_PLANS.MONTHLY.priceInPaise)}/mo
            </span>
            <Playful>
              <Link href="/sell" className={buttonVariants({ variant: "gold", size: "lg" })}>
                Start selling <ArrowRight className="h-4 w-4" />
              </Link>
            </Playful>
          </div>
        </Container>
      </section>

      {/* Newsletter — first-order offer */}
      <Newsletter />
    </>
  );
}

function CategoryTiles({
  visual,
  extra,
}: {
  visual: Category[];
  extra: Category[];
}) {
  return (
    <>
      {visual.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {visual.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.04}>
              <Link
                href={`/listings?category=${c.slug}`}
                className="group relative flex h-full flex-col items-center overflow-hidden rounded-[2rem] border-2 border-border bg-surface p-4 text-center card-shadow transition-transform hover:-translate-y-1"
              >
                <span
                  aria-hidden
                  className="absolute left-4 top-4 h-5 w-10 -rotate-6 rounded-[4px] border border-white/60 bg-background/60 shadow-sm backdrop-blur-sm"
                />
                <span
                  aria-hidden
                  className="absolute right-5 top-5 h-3 w-3 rounded-full bg-gold/75 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125"
                />
                <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-[1.5rem] bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={categoryArt[c.slug]}
                    alt=""
                    style={{ animationDelay: `${i * 0.35}s` }}
                    className="h-full w-full animate-[float_4s_ease-in-out_infinite] object-contain p-2"
                  />
                </span>
                <span className="mt-3 text-sm font-bold text-foreground">
                  {c.name}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      {extra.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          {extra.map((c, i) => (
            <Link
              key={c.id}
              href={`/listings?category=${c.slug}`}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 ${chipTints[i % chipTints.length]}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function HeroCopy() {
  return (
    <div className="max-w-sm md:max-w-[19rem] lg:max-w-xl">
      {/* Font sizes scale continuously with viewport width (clamp) within
          each image's zone, instead of jumping between fixed steps. Zones
          reset at md/lg because the tablet/desktop crops swap to a
          differently-shaped empty column, not a smooth continuation. */}
      <h1 className="mt-3 font-display text-[clamp(1.75rem,1.2rem_+_3.5vw,2.75rem)] font-semibold leading-[1.05] tracking-tight text-foreground sm:mt-6 md:text-[clamp(1.5rem,1rem_+_2vw,2rem)] lg:text-[clamp(2.25rem,1rem_+_2.5vw,3.75rem)]">
        Loved before,
        <br />
        <span className="ink-underline whitespace-nowrap">loved again</span>.
      </h1>
      <p className="mt-3 text-[clamp(0.875rem,0.75rem_+_0.6vw,1.125rem)] leading-relaxed text-muted-foreground sm:mt-6 sm:max-w-md md:text-sm lg:text-lg">
        Give baby gear a joyful second life. Browse preloved strollers,
        clothes, toys and more from families nearby.
      </p>
      <div className="mt-5 flex items-center gap-2 sm:mt-8 sm:gap-3">
        <Playful>
          <Link href="/listings" className={cn(buttonVariants({ size: "md" }), "lg:h-14 lg:px-8 lg:text-base")}>
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </Playful>
        <Playful>
          <Link href="/sell" className={cn(buttonVariants({ size: "md", variant: "outline" }), "lg:h-14 lg:px-8 lg:text-base")}>
            <Tag className="h-4 w-4" /> Sell an item
          </Link>
        </Playful>
      </div>
      <dl className="mt-6 hidden flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground sm:mt-10 sm:flex">
        <Trust icon={<Truck className="h-4 w-4 text-accent-text" />} label="Pickup and delivery options" />
        <Trust icon={<ShieldCheck className="h-4 w-4 text-accent-text" />} label="Seller profiles and reviews" />
        <Trust icon={<Sparkles className="h-4 w-4 text-accent-text" />} label="Condition graded listings" />
      </dl>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {label}
    </span>
  );
}
