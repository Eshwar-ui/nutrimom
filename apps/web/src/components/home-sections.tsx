import {
  BadgePercent,
  BadgeCheck,
  Leaf,
  HeartHandshake,
  ShieldCheck,
  Wallet,
  Sparkles,
  RotateCcw,
  CreditCard,
  Star,
  Heart,
} from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

/* ------------------------------- Why preloved ------------------------------ */
/* A scrapbook wall, not a feature grid: one oversized stat tile anchors the
   corner, the rest are taped on at a slight tilt like real cut-outs. */

const valueProps = [
  {
    icon: BadgePercent,
    tint: "bg-primary text-primary-foreground",
    stat: "70%",
    title: "off, on average",
    body: "Real savings on gear they'll outgrow in a season anyway — not a clearance-rack gimmick.",
    rotate: "lg:-rotate-2",
    tape: "left-10 -rotate-6",
    span: "sm:col-span-2 lg:col-span-2 lg:row-span-2",
    big: true,
  },
  {
    icon: BadgeCheck,
    tint: "bg-sage/60",
    title: "Gently checked",
    body: "Every listing is condition-graded, so you know exactly what arrives.",
    rotate: "lg:rotate-1",
    tape: "right-8 rotate-3",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    icon: Leaf,
    tint: "bg-sky/60",
    title: "Kinder to the planet",
    body: "Keep strollers, cribs and onesies out of landfill.",
    rotate: "lg:-rotate-1",
    tape: "left-6 -rotate-3",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    icon: HeartHandshake,
    tint: "bg-lavender/60",
    title: "From moms, for moms",
    body: "A community that gets what your little one actually needs — no guessing games.",
    rotate: "lg:rotate-1",
    tape: "left-1/2 -translate-x-1/2 rotate-2",
    span: "sm:col-span-2 lg:col-span-2 lg:row-span-1",
  },
];

export function WhyPreloved() {
  return (
    <Container className="py-14">
      <div className="mb-9 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">
          Why preloved
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Loved gear, loved prices, loved planet
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        {valueProps.map((v, i) => (
          <Reveal key={v.title} delay={i * 0.07} className={v.span}>
            <div
              className={cn(
                "group relative flex h-full flex-col justify-center overflow-hidden rounded-[1.75rem] border-2 border-border p-6 card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:rotate-0",
                v.big ? "bg-surface" : "bg-surface",
                v.rotate,
              )}
            >
              {/* washi tape, pinning each cut-out at a different spot */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -top-3 h-6 w-20 rounded-[4px] border border-white/50 bg-surface/70 shadow-sm backdrop-blur-sm",
                  v.tape,
                )}
              />
              {v.big ? (
                <>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10">
                    <v.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
                  </span>
                  <span className="mt-3 font-display text-6xl font-bold leading-none text-primary sm:text-7xl">
                    {v.stat}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-2 max-w-sm leading-relaxed text-muted-foreground">
                    {v.body}
                  </p>
                </>
              ) : (
                <>
                  <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", v.tint)}>
                    <v.icon className="h-5 w-5 text-foreground/70" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">
                    {v.body}
                  </p>
                </>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
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
    <section className="overflow-hidden bg-surface-2 py-16">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
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
      "I kitted out my newborn's whole nursery for less than one new stroller. The pram I got looks barely used.",
    name: "Ananya Reddy",
    location: "Bengaluru",
    paper: "bg-blush/45",
    sticker: "bg-blush text-[#7a2447]",
    icon: Heart,
    rotate: "-rotate-2",
    lift: "md:mt-10",
  },
  {
    quote:
      "Sold my daughter's outgrown clothes in a weekend and the payout landed before I'd even done the school run.",
    name: "Meera Nair",
    location: "Kochi",
    paper: "bg-sky/50",
    sticker: "bg-sky text-[#215172]",
    icon: Star,
    rotate: "rotate-1",
    lift: "",
  },
  {
    quote:
      "The condition grading is spot on. 'Like new' really meant like new — I was genuinely surprised.",
    name: "Ritika Shah",
    location: "Pune",
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
        <p className="text-sm font-bold uppercase tracking-widest text-accent">
          Loved by moms
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Straight from the group chat
        </h2>
      </div>
      <div className="grid gap-9 md:grid-cols-3 md:gap-6">
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

              <div className="flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" strokeWidth={0} />
                ))}
              </div>
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
