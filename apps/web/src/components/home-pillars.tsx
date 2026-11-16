import Link from "next/link";
import { TrackedLink } from "./tracked-link";
import { buttonVariants } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { Container } from "./ui/primitives";
import { STAGES } from "@/lib/site-nav";

/**
 * Home page sections around the four services (service-showcase.tsx): pick
 * your stage, and the closing band. Both sit above or after the marketplace
 * block, because the brief asks for the four services to be obvious first — a
 * visitor arriving from a pregnancy-yoga reel should not have to scroll past a
 * product grid to learn that yoga is offered at all.
 */

export function StageSelector() {
  return (
    <section className="relative">
      <Container className="py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent-text">
            Start where you are
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Where are you right now?
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Tell us your stage and we&apos;ll take you straight to the support
            that fits it.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage) => (
              <li key={stage.label} className="h-full list-none">
                <TrackedLink
                  event="stage_click"
                  eventProps={{ stage: stage.label, to: stage.href }}
                  href={stage.href}
                  className="group flex h-full flex-col rounded-card border-2 border-border bg-surface p-6 card-shadow transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-primary/45"
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
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * The brief's closing section (§14).
 *
 * "Find your village" and the final CTA are written there as two blocks, but
 * they carry the same sentence — "Motherhood was never meant to be done alone"
 * and "You're not meant to do motherhood alone". Saying it twice in a row
 * weakens it, so they are one closing band.
 *
 * The brief's button reads "Explore The Nurture Moms", which names no
 * destination; at the foot of the page that would either scroll back up or go
 * nowhere useful. The community is what "find your village" actually asks the
 * reader to do, so that is where it goes.
 */
export function FindYourVillage() {
  return (
    <section className="relative">
      <Container className="py-band">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Find your village
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Motherhood was never meant to be done alone. Come and ask the
            question you have been searching the internet for.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <TrackedLink
              event="pillar_click"
              eventProps={{ pillar: "connect", to: "/community", placement: "closing" }}
              href="/community"
              className={buttonVariants({ size: "lg" })}
            >
              Join Our Community
            </TrackedLink>
            <Link
              href="/about"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Meet the Founders
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
