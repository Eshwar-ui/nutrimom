import Link from "next/link";
import { ArrowRight, Flower2, Apple, Users, Recycle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "./ui/primitives";
import { Reveal } from "./reveal";
import { PILLARS, STAGES, BRAND_LINE, type PillarKey } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

/**
 * The two sections that turn the home page from a shop into an ecosystem
 * entrance: pick your stage, or pick your pillar.
 *
 * Both render above the marketplace blocks, because the founders' brief (§3)
 * asks for the four pillars to be obvious within the first screen — a visitor
 * arriving from a pregnancy-yoga reel should not have to scroll past a product
 * grid to learn that yoga is offered at all.
 */

/** Per-pillar art direction. Kept here, not in lib/site-nav, so the IA file
 *  stays free of presentation and can be imported by `sitemap.ts`. */
const PILLAR_STYLE: Record<
  PillarKey,
  { icon: LucideIcon; tint: string; ring: string }
> = {
  move: { icon: Flower2, tint: "bg-blush/60", ring: "hover:border-blush" },
  nourish: { icon: Apple, tint: "bg-sage/60", ring: "hover:border-sage" },
  connect: { icon: Users, tint: "bg-sky/60", ring: "hover:border-sky" },
  "pass-it-on": { icon: Recycle, tint: "bg-lavender/60", ring: "hover:border-lavender" },
};

export function StageSelector() {
  return (
    <section className="relative">
      <Container className="py-14">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
            Start here
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Where are you right now?
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted-foreground">
            Tell us your stage and we&apos;ll take you straight to the support
            that fits it.
          </p>
        </div>

        <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage, i) => (
            <Reveal key={stage.label} delay={(i % 3) * 0.06}>
              <li className="h-full list-none">
                <Link
                  href={stage.href}
                  className="group flex h-full flex-col rounded-[1.75rem] border-2 border-border bg-surface p-6 card-shadow transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-primary/45"
                >
                  <span className="font-display text-xl font-semibold leading-snug text-foreground">
                    {stage.label}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {stage.covers}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-accent-text">
                    Take me there
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function PillarGrid() {
  return (
    <section className="relative">
      <Container className="py-14">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
            {BRAND_LINE}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            One place for your motherhood journey
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Four kinds of support, built around the same idea — that motherhood
            is easier when someone practical is in your corner.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar, i) => {
            const style = PILLAR_STYLE[pillar.key];
            const Icon = style.icon;
            return (
              <Reveal key={pillar.key} delay={(i % 2) * 0.08}>
                <Link
                  href={pillar.href}
                  className={cn(
                    "group flex h-full flex-col rounded-[1.75rem] border-2 border-border bg-surface p-7 card-shadow transition-[transform,border-color] duration-300 hover:-translate-y-1",
                    style.ring,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                        style.tint,
                      )}
                    >
                      <Icon className="h-5 w-5 text-foreground/75" strokeWidth={1.7} />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">
                      {pillar.eyebrow}
                    </p>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {pillar.blurb}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-accent-text">
                    {pillar.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
