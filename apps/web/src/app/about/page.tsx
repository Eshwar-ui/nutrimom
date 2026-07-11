import Link from "next/link";
import {
  Heart,
  Leaf,
  ShieldCheck,
  Users,
  ShoppingBag,
  Tag,
  Gift,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Playful } from "@/components/ui/playful";
import { DecorativeElement } from "@/components/decorative-element";

export const metadata = {
  title: "About us",
  description: "Why The Nurture Moms exists, and how the marketplace works.",
};

const values = [
  {
    icon: Heart,
    title: "From families, for families",
    body: "Listings come from community members passing on gear their families have outgrown.",
    paper: "bg-blush/45",
    sticker: "bg-blush text-[#7a2447]",
    rotate: "-rotate-2",
    tape: "left-8 -rotate-6",
    lift: "sm:mt-6",
  },
  {
    icon: Leaf,
    title: "Kinder to the planet",
    body: "Strollers, cots, clothes and toys get a useful second life instead of becoming waste.",
    paper: "bg-sage/45",
    sticker: "bg-sage text-[#2f5236]",
    rotate: "rotate-1",
    tape: "right-10 rotate-3",
    lift: "",
  },
  {
    icon: ShieldCheck,
    title: "Context before checkout",
    body: "Condition details, seller profiles, handover options and feedback help buyers choose well.",
    paper: "bg-sky/50",
    sticker: "bg-sky text-[#215172]",
    rotate: "rotate-1",
    tape: "left-10 -rotate-3",
    lift: "sm:mt-6",
  },
  {
    icon: Users,
    title: "A community marketplace",
    body: "Parenting gear is costly and used briefly. We help that value circulate to another family.",
    paper: "bg-lavender/50",
    sticker: "bg-lavender text-[#4a3170]",
    rotate: "-rotate-1",
    tape: "right-8 rotate-6",
    lift: "",
  },
];

const steps = [
  {
    icon: ShoppingBag,
    tint: "bg-blush/60",
    title: "Shop preloved",
    body: "Browse gently used pieces from local families at a fraction of retail.",
  },
  {
    icon: Tag,
    tint: "bg-sage/60",
    title: "Sell your outgrown",
    body: "Snap a few photos, set a price, and give your baby gear a second home.",
  },
  {
    icon: Gift,
    tint: "bg-sky/60",
    title: "Or pass it on",
    body: "Donate what you no longer need to another mom who'll treasure it.",
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
              Useful things deserve{" "}
              <span className="ink-underline whitespace-nowrap">another chapter</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              The Nurture Moms is a marketplace for buying, selling and donating gently used baby and maternity essentials — a joyful second life for the gear your family has outgrown.
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
              Baby gear has a short shelf life and a long price tag. A stroller may be outgrown in a year, a maternity wardrobe in months. We make it easy to pass useful things to the next family — at a price that makes sense.
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

      {/* How it works */}
      <section className="relative overflow-hidden bg-surface-2">
        <DecorativeElement src="/images/bg-element-sage-pram.png" className="-left-6 bottom-6 hidden w-40 -rotate-3 opacity-25 lg:block" />
        <DecorativeElement src="/images/bg-element-folded-clothes.png" className="right-6 top-10 hidden w-28 rotate-3 opacity-30 lg:block" />
        <Container className="relative py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">Buy · Sell · Donate</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">How the marketplace works</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08} className={i === 1 ? "md:mt-6" : ""}>
                <div className="flex flex-col items-center px-2 text-center">
                  <span className={`relative grid h-16 w-16 place-items-center rounded-2xl ring-8 ring-surface-2 ${s.tint}`}>
                    <s.icon className="h-7 w-7 text-foreground/70" strokeWidth={1.6} />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
            Ready to give baby gear a joyful second life?
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
