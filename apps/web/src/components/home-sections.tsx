import Link from "next/link";
import {
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Sparkles,
  RotateCcw,
  CreditCard,
  Star,
  Heart,
} from "lucide-react";
import { conditionLabels, type Condition } from "@nutrimom/shared";
import { Container } from "@/components/ui/primitives";
import { Reveal } from "@/components/reveal";
import { PlayfulBackground } from "@/components/playful-background";
import { cn } from "@/lib/utils";

/* -------------------------------- Shop your way ---------------------------- */
/* Functional entry points into the catalog: every tile/chip deep-links into
   /listings with real filters the shop page reads (min/max, condition, search). */

const budgets = [
  { range: "Under ₹500", note: "Grab-and-go steals", href: "/listings?max=500", tint: "bg-blush/60" },
  { range: "₹500 – ₹1,000", note: "Everyday essentials", href: "/listings?min=500&max=1000", tint: "bg-sky/60" },
  { range: "₹1,000 – ₹2,500", note: "Bigger-ticket gear", href: "/listings?min=1000&max=2500", tint: "bg-sage/60" },
  { range: "₹2,500 & up", note: "Premium & sets", href: "/listings?min=2500", tint: "bg-lavender/60" },
];

const conditionNotes: Record<Condition, string> = {
  NEW: "Unused, tags on",
  LIKE_NEW: "Barely used",
  GOOD: "Gently loved",
  FAIR: "Well-loved, works great",
};

const popularSearches = [
  "Strollers", "Car seat", "Winter wear", "Cribs",
  "Baby carrier", "Feeding", "High chair", "Books",
];

export function ShopYourWay() {
  return (
    <Container className="py-14">
      <div className="mb-9 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
          Find it fast
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Shop your way
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Skip the scroll — jump straight to what fits by budget, condition, or what everyone&apos;s after.
        </p>
      </div>

      {/* By budget */}
      <GroupLabel icon={Wallet}>By budget</GroupLabel>
      <div className="mb-11 grid grid-cols-2 gap-4 md:grid-cols-4">
        {budgets.map((b, i) => (
          <Reveal key={b.range} delay={i * 0.05}>
            <Link
              href={b.href}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border-2 border-border bg-surface p-5 card-shadow transition-transform duration-300 hover:-translate-y-1"
            >
              <span className={cn("grid h-9 w-9 place-items-center rounded-xl", b.tint)}>
                <span className="font-display text-base font-bold text-foreground/70">₹</span>
              </span>
              <ArrowUpRight className="absolute right-4 top-4 h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              <div className="mt-9">
                <p className="font-display text-xl font-bold leading-tight text-foreground">{b.range}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{b.note}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-x-10 gap-y-11 lg:grid-cols-[1.5fr_1fr]">
        {/* By condition */}
        <div>
          <GroupLabel icon={Sparkles}>By condition</GroupLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.entries(conditionLabels) as [Condition, string][]).map(([key, label], i) => (
              <Reveal key={key} delay={i * 0.05}>
                <Link
                  href={`/listings?condition=${key}`}
                  className="group flex h-full flex-col rounded-[1.25rem] border-2 border-border bg-surface p-4 card-shadow transition-transform duration-300 hover:-translate-y-1 hover:border-primary/40"
                >
                  <span className="font-display text-base font-semibold text-foreground">{label}</span>
                  <span className="mt-1 text-xs leading-snug text-muted-foreground">{conditionNotes[key]}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Popular searches */}
        <div>
          <GroupLabel icon={TrendingUp}>Popular right now</GroupLabel>
          <div className="flex flex-wrap gap-2.5">
            {popularSearches.map((term) => (
              <Link
                key={term}
                href={`/listings?search=${encodeURIComponent(term.toLowerCase())}`}
                className="inline-flex items-center rounded-full border-2 border-dashed border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

function GroupLabel({ icon: Icon, children }: { icon: typeof Wallet; children: React.ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
      <Icon className="h-4 w-4 text-accent-text" strokeWidth={2} />
      {children}
    </h3>
  );
}

/* ------------------------------ Trust & safety ----------------------------- */

const guarantees = [
  {
    icon: ShieldCheck,
    title: "Seller context",
    body: "See the seller's city, profile, listings and feedback before buying.",
  },
  {
    icon: Wallet,
    title: "Server-priced orders",
    body: "Availability and the final amount are checked again at checkout.",
  },
  {
    icon: Sparkles,
    title: "Condition graded",
    body: "Like-new, good or well-loved — clearly labelled.",
  },
  {
    icon: RotateCcw,
    title: "Clear handover",
    body: "Pickup or delivery options are shown on every listing.",
  },
  {
    icon: CreditCard,
    title: "Secure checkout",
    body: "Razorpay handles UPI, card and netbanking payment details.",
  },
];

const tickerTints = ["bg-blush/70", "bg-sky/70", "bg-sage/70", "bg-lavender/70", "bg-beige"];

export function TrustSafety() {
  return (
    <section className="relative isolate overflow-hidden bg-surface-2 py-16">
      <PlayfulBackground variant="trust" />
      <Container className="relative z-[1]">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
            Peace of mind
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Buying secondhand, minus the worry
          </h2>
        </div>
      </Container>

      {/* Two rows of guarantee pills, drifting in opposite directions — a
          ticker instead of a stiff feature grid. Pause on hover to read. */}
      <div className="group/row mb-4 flex w-max gap-4 [animation-duration:34s] animate-[marquee_34s_linear_infinite] hover:[animation-play-state:paused]">
        {[...guarantees, ...guarantees].map((g, i) => (
          <GuaranteePill key={i} guarantee={g} tint={tickerTints[i % tickerTints.length]} />
        ))}
      </div>
      <div className="flex w-max gap-4 [animation-direction:reverse] [animation-duration:30s] animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
        {[...guarantees.slice().reverse(), ...guarantees.slice().reverse()].map((g, i) => (
          <GuaranteePill key={i} guarantee={g} tint={tickerTints[(i + 2) % tickerTints.length]} />
        ))}
      </div>
    </section>
  );
}

function GuaranteePill({
  guarantee: g,
  tint,
}: {
  guarantee: (typeof guarantees)[number];
  tint: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-[1.5rem] border-2 border-border px-5 py-3.5 card-shadow",
        tint,
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface">
        <g.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block whitespace-nowrap font-display text-sm font-semibold text-foreground">
          {g.title}
        </span>
        <span className="block whitespace-nowrap text-xs text-foreground/70">
          {g.body}
        </span>
      </span>
    </div>
  );
}

/* ------------------------------- Testimonials ------------------------------ */

const testimonials = [
  {
    quote:
      "Review every photo, condition grade, included accessory, and reason for selling before you commit.",
    name: "Inspect the details",
    location: "Before checkout",
    paper: "bg-blush/45",
    sticker: "bg-blush text-[#7a2447]",
    icon: Heart,
    rotate: "-rotate-2",
    lift: "md:mt-10",
  },
  {
    quote:
      "Use the seller profile and listing history for context. Ask about anything the listing does not answer.",
    name: "Know the seller",
    location: "Before payment",
    paper: "bg-sky/50",
    sticker: "bg-sky text-[#215172]",
    icon: Star,
    rotate: "rotate-1",
    lift: "",
  },
  {
    quote:
      "Confirm pickup or delivery, timing, packaging, and safety-critical product history before handover.",
    name: "Plan the handover",
    location: "Before delivery",
    paper: "bg-sage/45",
    sticker: "bg-sage text-[#2f5236]",
    icon: Sparkles,
    rotate: "-rotate-1",
    lift: "md:mt-16",
  },
];

export function Testimonials() {
  return (
    <section
      className="relative py-16"
      style={{
        backgroundImage:
          "radial-gradient(color-mix(in oklab, var(--foreground) 8%, transparent) 1.5px, transparent 1.5px)",
        backgroundSize: "22px 22px",
      }}
    >
      <Container className="relative">
      <div className="mb-14 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
          Buy with context
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          A considered secondhand rhythm
        </h2>
      </div>
      <div className="grid gap-6 pb-8 pt-4 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1} className={t.lift}>
            <figure
              className={`group relative flex h-full flex-col rounded-[1.75rem] border-2 border-border ${t.paper} p-7 card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${t.rotate} hover:-translate-y-1.5 hover:rotate-0`}
            >
              {/* washi tape pinning the note */}
              <span
                aria-hidden
                className="absolute -top-3 left-8 h-6 w-24 -rotate-6 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm"
              />
              {/* corner sticker */}
              <span
                aria-hidden
                className={`absolute -right-3 -top-3 grid h-11 w-11 rotate-6 place-items-center rounded-full border-2 border-surface transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:rotate-12 group-hover:scale-110 ${t.sticker}`}
              >
                <t.icon className="h-5 w-5 fill-current" strokeWidth={1.6} />
              </span>
              {/* oversized quote glyph */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-2 select-none font-display text-7xl leading-none text-foreground/10"
              >
                &rdquo;
              </span>

              <blockquote className="relative mt-4 flex-1 font-display text-lg leading-relaxed text-foreground">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-surface bg-surface text-sm font-bold text-foreground shadow-sm">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <span className="text-sm">
                  <span className="block font-bold text-foreground">
                    {t.name}
                  </span>
                  <span className="block text-muted-foreground">
                    {t.location}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      </Container>
    </section>
  );
}
