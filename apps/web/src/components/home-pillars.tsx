import { TrackedLink } from "./tracked-link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "./ui/primitives";
import { Reveal } from "./reveal";
import { PILLARS, STAGES, type PillarKey } from "@/lib/site-nav";
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

/**
 * Per-pillar art direction. Kept here, not in lib/site-nav, so the IA file
 * stays free of presentation and can be imported by `sitemap.ts`.
 *
 * The ink is `primary` on all four rather than a colour each: the pastels are
 * defined identically in both themes, so any of them used as a stroke is
 * invisible on cream and only works on the dark card. The drawings carry the
 * difference; the wash gives each card its own corner temperature.
 */
const PILLAR_STYLE: Record<PillarKey, { wash: string; hover: string }> = {
  move: { wash: "bg-blush/45", hover: "hover:border-blush" },
  nourish: { wash: "bg-sage/40", hover: "hover:border-sage" },
  connect: { wash: "bg-sky/45", hover: "hover:border-sky" },
  "pass-it-on": { wash: "bg-lavender/45", hover: "hover:border-lavender" },
};

const PILLAR_IMAGE: Record<PillarKey, string> = {
  move: "/images/pillars/pillar-move.png",
  nourish: "/images/pillars/pillar-nourish.png",
  connect: "/images/pillars/pillar-connect.png",
  "pass-it-on": "/images/pillars/pillar-pass-it-on.png",
};

export function StageSelector() {
  return (
    <section className="relative">
      <Container className="py-14">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Where are you right now?
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Tell us your stage and we&apos;ll take you straight to the support
            that fits it.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage, i) => (
            <Reveal key={stage.label} delay={(i % 3) * 0.06}>
              <li className="h-full list-none">
                <TrackedLink
                  event="stage_click"
                  eventProps={{ stage: stage.label, to: stage.href }}
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
                </TrackedLink>
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
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            One place for your motherhood journey
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Four kinds of support, built around the same idea — that motherhood
            is easier when someone practical is in your corner.
          </p>
        </div>

        {/* Portrait cards: the word leads from the top-left, the drawing
            answers from the bottom-right, and the link sits on the diagonal
            between them. One column on a phone, two on a tablet, four across
            on a desktop where the full set reads as one row. */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, i) => {
            const style = PILLAR_STYLE[pillar.key];
            return (
              <Reveal key={pillar.key} delay={(i % 4) * 0.07}>
                <TrackedLink
                  event="pillar_click"
                  eventProps={{ pillar: pillar.key, to: pillar.href }}
                  href={pillar.href}
                  className={cn(
                    "group relative flex h-full min-h-[24rem] flex-col overflow-hidden rounded-[1.75rem] border-2 border-border bg-surface p-7 card-shadow",
                    "transition-[transform,border-color] duration-300 hover:-translate-y-1",
                    style.hover,
                  )}
                >
                  {/* Corner wash — sits under the drawing and grows a little on
                      hover, so the card warms rather than just lifting. */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125",
                      style.wash,
                    )}
                  />
                  <Image
                    src={PILLAR_IMAGE[pillar.key]}
                    alt=""
                    width={320}
                    height={320}
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-5 -right-4 w-48 object-contain transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:scale-105"
                  />

                  {/* The pillar word is the heading, not a label above one. */}
                  <h3 className="relative">
                    <span className="block font-display text-[2rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
                      {pillar.eyebrow}
                    </span>
                    <span className="mt-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-accent-text">
                      {pillar.title}
                    </span>
                  </h3>

                  <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">
                    {pillar.blurb}
                  </p>

                  {/* Bottom-left, clear of the drawing's corner. */}
                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                    {pillar.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </TrackedLink>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
