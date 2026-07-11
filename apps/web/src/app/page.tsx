import Link from "next/link";
import {
  ArrowRight,
  Recycle,
  ShieldCheck,
  Truck,
  Tag,
  Gift,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { Category, Listing } from "@nutrimom/shared";
import { getCategories, getListings } from "@/lib/listings";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Playful } from "@/components/ui/playful";
import { Reveal } from "@/components/reveal";
import { HeroWave } from "@/components/section-wave";
import { ListingCard } from "@/components/listing-card";
import {
  WhyPreloved,
  TrustSafety,
  Testimonials,
} from "@/components/home-sections";
import { Newsletter } from "@/components/newsletter";
import { JourneyLine } from "@/components/journey-line";

const chipTints = [
  "bg-blush/70 text-[#7a2447]",
  "bg-sage/70 text-[#2f5236]",
  "bg-sky/70 text-[#215172]",
  "bg-lavender/70 text-[#4a3170]",
  "bg-beige text-[#6b4a2a]",
];

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
  let categories: Category[] = [];
  try {
    const [f, cats] = await Promise.all([
      getListings({ featured: true, pageSize: 8 }),
      getCategories(),
    ]);
    featured = f.items;
    if (featured.length === 0) {
      featured = (await getListings({ pageSize: 8 })).items;
    }
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/nutrimom-playful-mama-banner-extended.png"
          alt="Moms sharing preloved baby essentials"
          className="block w-full"
        />
        <div className="absolute inset-0 hidden items-start pt-[max(80px,8vw)] lg:flex">
          <Container>
            <HeroCopy />
          </Container>
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
      {/* Copy sits below the full image on smaller screens */}
      <section className="lg:hidden">
        <Container className="py-10">
          <HeroCopy />
        </Container>
      </section>

      {/* Category tiles — plain shared cream, tucked up under the banner so the
          seam is cream-on-cream and disappears. */}
      {categories.length > 0 && (
        <section className="relative -mt-8 overflow-hidden bg-background pt-8">
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
          <Container className="relative pb-16 pt-10">
            <CategoryTiles visual={visualCategories} extra={extraCategories} />
          </Container>
        </section>
      )}

      {/* Why preloved — value proposition */}
      <WhyPreloved />

      {/* Featured */}
      <section className="relative overflow-hidden">
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
        <Container className="relative py-14">
          {categories.length > 0 && (
            <div className="mb-8 -mt-1 overflow-hidden">
              <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
                {[...categories, ...categories].map((c, i) => (
                  <span
                    key={i}
                    className="whitespace-nowrap rounded-full border-2 border-dashed border-border px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground/70"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-9 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-accent">
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
              Start the API and seed the database to see listings here.
            </div>
          )}
        </Container>
      </section>

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
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
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
        <Container className="relative grid gap-8 py-16 md:grid-cols-[2fr_auto_1fr] md:items-center">
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
              Free to list
            </span>
            <Playful>
              <Link href="/sell">
                <Button variant="gold" size="lg">
                  Start selling <ArrowRight className="h-4 w-4" />
                </Button>
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
                className="group flex h-full flex-col items-center rounded-[2rem] border-2 border-border bg-surface p-4 text-center card-shadow transition-transform hover:-translate-y-1"
              >
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
    <div className="max-w-xl">
      <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-1.5 text-xs font-bold text-primary">
        <Recycle className="h-3.5 w-3.5" />
        Buy · Sell · Donate
      </span>
      <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
        Loved before,{" "}
        <span className="ink-underline whitespace-nowrap">loved again</span>.
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
        Give baby gear a joyful second life. Browse preloved strollers,
        clothes, toys and more from families nearby.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Playful>
          <Link href="/listings">
            <Button size="lg">
              Start shopping <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Playful>
        <Playful>
          <Link href="/sell">
            <Button size="lg" variant="outline">
              <Tag className="h-4 w-4" /> Sell an item
            </Button>
          </Link>
        </Playful>
      </div>
      <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
        <Trust icon={<Truck className="h-4 w-4 text-accent-text" />} label="Pickup and delivery options" />
        <Trust icon={<ShieldCheck className="h-4 w-4 text-accent-text" />} label="Seller profiles and reviews" />
        <Trust icon={<Sparkles className="h-4 w-4 text-accent-text" />} label="Condition graded listings" />
      </dl>
    </div>
  );
}

function DecorativeElement({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden="true"
      src={src}
      alt=""
      className={`pointer-events-none absolute select-none ${className}`}
    />
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
