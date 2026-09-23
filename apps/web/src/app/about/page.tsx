import Link from "next/link";
import {
  Heart,
  Leaf,
  ShieldCheck,
  Users,
  Tag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Playful } from "@/components/ui/playful";
import { DecorativeElement } from "@/components/decorative-element";
import { pageMetadata } from "@/lib/seo";
import { BRAND_LINE } from "@/lib/site-nav";
import { PillarCards } from "@/components/pillar-cards";

export const metadata = pageMetadata({
  title: "About us",
  description:
    "Why The Nurture Moms exists: yoga, nutrition, community and preloved essentials for Indian moms — founded by Sudha and Nandini to support every stage of motherhood.",
  path: "/about",
});

/**
 * What the business stands for, across all four pillars.
 *
 * Rewritten from the marketplace-only set: three of the four used to describe
 * secondhand gear, which read as the whole identity on the page whose job is
 * to say what the identity is.
 */
const values = [
  {
    icon: Heart,
    title: "Mom-led, start to finish",
    body: "Built by mothers who have been through it, for mothers going through it now.",
    paper: "bg-blush/45",
    sticker: "bg-blush text-[#7a2447]",
    rotate: "-rotate-2",
    tape: "left-8 -rotate-6",
    lift: "sm:mt-6",
  },
  {
    icon: ShieldCheck,
    title: "Practical over perfect",
    body: "Guidance you can act on this week — not an ideal routine nobody has time for.",
    paper: "bg-sky/50",
    sticker: "bg-sky text-[#215172]",
    rotate: "rotate-1",
    tape: "right-10 rotate-3",
    lift: "",
  },
  {
    icon: Users,
    title: "Nobody does this alone",
    body: "Pregnancy, postpartum and toddler years are easier with people who understand them.",
    paper: "bg-lavender/50",
    sticker: "bg-lavender text-[#4a3170]",
    rotate: "rotate-1",
    tape: "left-10 -rotate-3",
    lift: "sm:mt-6",
  },
  {
    icon: Leaf,
    title: "Affordable, and kinder to the planet",
    body: "Sessions priced for real families, and gear that circulates instead of becoming waste.",
    paper: "bg-sage/45",
    sticker: "bg-sage text-[#2f5236]",
    rotate: "-rotate-1",
    tape: "right-8 rotate-6",
    lift: "",
  },
];

/**
 * The founders.
 *
 * **Nandini's entry says "Co-founder" and nothing else, on purpose.** The
 * founders' brief gives no further detail about her, and inventing a
 * background for a real person — however flattering — would be publishing a
 * claim nobody made. Sudha's line repeats only what /yoga already publishes.
 * Fill these in when the founders supply their own words; do not guess.
 */
const founders = [
  {
    name: "Sudha",
    role: "Co-founder",
    detail: "Leads the yoga and Garbhasanskar practice.",
    paper: "bg-blush/45",
    rotate: "-rotate-1",
    tape: "left-10 -rotate-6",
  },
  {
    name: "Nandini",
    role: "Co-founder",
    detail: null,
    paper: "bg-sage/45",
    rotate: "rotate-1",
    tape: "right-10 rotate-3",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-sun-doodle.png" className="left-6 top-10 hidden w-20 opacity-80 sm:block" />
        <DecorativeElement src="/images/bg-element-leaf-sprig.png" className="-left-16 bottom-0 hidden w-48 -rotate-12 opacity-35 lg:block" />
        <DecorativeElement src="/images/bg-element-doodle-cluster.png" className="right-6 top-16 hidden w-28 rotate-6 opacity-60 md:block" />
        <DecorativeElement src="/images/bg-element-peach-onesie.png" className="-right-8 bottom-2 hidden w-28 -rotate-6 opacity-40 lg:block" />
        <Container className="relative py-14 text-center sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Our purpose
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Motherhood is a journey.{" "}
              <span className="ink-underline whitespace-nowrap">You don&apos;t have to do it alone</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              The Nurture Moms is a mom-led space for every stage of motherhood — yoga and Garbhasanskar, nutrition for you and your baby, a community that gets it, and preloved essentials that pass from one family to the next.
            </p>
            <p className="mx-auto mt-5 text-sm font-bold uppercase tracking-widest text-accent-text">
              {BRAND_LINE}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Story note — a taped scrapbook card */}
      <Container className="relative pb-4">
        <Reveal>
          <div className="relative mx-auto max-w-3xl rotate-[-0.6deg] rounded-[2rem] border-2 border-border bg-cream p-8 card-shadow sm:p-10">
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-3 rounded-[4px] border border-white/50 bg-surface/70 shadow-sm backdrop-blur-sm" />
            <p className="text-center font-display text-xl leading-relaxed text-foreground sm:text-2xl">
              Pregnancy, birth and the years that follow ask a lot of a mother — and the support tends to arrive in fragments. A class here, an opinion there, a marketplace somewhere else. We put the pieces in one place, run by people who have been through it.
            </p>
          </div>
        </Reveal>
      </Container>

      {/* Values — scrapbook wall */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-dotted-trail.png" className="-left-24 top-10 hidden w-[28rem] opacity-30 xl:block" />
        <DecorativeElement src="/images/bg-element-toy-accent.png" className="right-4 top-8 hidden w-24 rotate-6 opacity-40 md:block" />
        <Container className="relative py-14">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">What we stand for</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">Little values, loved big</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08} className={v.lift}>
                <div
                  className={`group relative flex h-full gap-5 rounded-[1.75rem] border-2 border-border ${v.paper} p-6 card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${v.rotate} hover:-translate-y-1.5 hover:rotate-0 sm:p-7`}
                >
                  <span aria-hidden className={`absolute -top-3 h-6 w-20 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm ${v.tape}`} />
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-surface transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-110 ${v.sticker}`}>
                    <v.icon className="h-6 w-6" strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">{v.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Founders */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-dotted-trail.png" className="-right-24 top-6 hidden w-[26rem] opacity-25 xl:block" />
        <Container className="relative py-14">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">Who we are</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">The moms behind it</h2>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {founders.map((f, i) => (
              <Reveal key={f.name} delay={i * 0.08}>
                <div
                  className={`relative flex h-full flex-col items-center rounded-[1.75rem] border-2 border-border ${f.paper} p-7 text-center card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${f.rotate} hover:-translate-y-1.5 hover:rotate-0`}
                >
                  <span aria-hidden className={`absolute -top-3 h-6 w-20 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm ${f.tape}`} />
                  <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-surface bg-surface/70 font-display text-2xl font-semibold text-foreground">
                    {f.name.charAt(0)}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">{f.name}</h3>
                  <p className="mt-1 text-sm font-bold uppercase tracking-widest text-accent-text">{f.role}</p>
                  {f.detail && (
                    <p className="mt-3 leading-relaxed text-muted-foreground">{f.detail}</p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* The four pillars */}
      <section className="relative overflow-hidden bg-surface-2">
        <DecorativeElement src="/images/bg-element-sage-pram.png" className="-left-6 bottom-6 hidden w-40 -rotate-3 opacity-25 lg:block" />
        <DecorativeElement src="/images/bg-element-folded-clothes.png" className="right-6 top-10 hidden w-28 rotate-3 opacity-30 lg:block" />
        <Container className="relative py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">{BRAND_LINE}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">What we do</h2>
          </div>
          {/* The same component the home page's "One place for your motherhood
              journey" section renders — /about answers the same question, and
              two hand-built versions of one answer drift the moment a pillar's
              wording changes. */}
          <PillarCards source="about" />
        </Container>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <DecorativeElement src="/images/bg-element-blush-swash.png" className="-left-40 -top-20 w-[34rem] opacity-20" />
        <DecorativeElement src="/images/bg-element-gift-box.png" className="bottom-3 right-[18%] hidden w-28 rotate-6 opacity-25 lg:block" />
        <DecorativeElement src="/images/bg-element-toy-accent.png" className="right-8 top-6 hidden w-24 opacity-60 sm:block" />
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <Container className="relative flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-primary-foreground sm:text-4xl">
            Wherever you are in the journey, there&apos;s a place to start.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Playful>
              <Link href="/listings" className={buttonVariants({ variant: "gold", size: "lg" })}>
                Shop preloved <ArrowRight className="h-4 w-4" />
              </Link>
            </Playful>
            <Playful>
              <Link href="/sell" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <Tag className="h-4 w-4" /> Sell an item
              </Link>
            </Playful>
            <Playful>
              <Link href="/contact" className="inline-flex h-14 items-center gap-1.5 rounded-full border border-primary-foreground/40 px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                Get in touch
              </Link>
            </Playful>
          </div>
        </Container>
      </section>
    </>
  );
}
