import Link from "next/link";
import { TrackedLink } from "./tracked-link";
import { buttonVariants } from "./ui/button";
import { MEMBERSHIP_PLANS, formatPaise } from "@nutrimom/shared";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "./ui/primitives";
import { Reveal } from "./reveal";
import { STAGES } from "@/lib/site-nav";
import { PillarCards } from "./pillar-cards";

/**
 * The two sections that turn the home page from a shop into an ecosystem
 * entrance: pick your stage, or pick your pillar.
 *
 * Both render above the marketplace blocks, because the founders' brief (§3)
 * asks for the four pillars to be obvious within the first screen — a visitor
 * arriving from a pregnancy-yoga reel should not have to scroll past a product
 * grid to learn that yoga is offered at all.
 */

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

        <div className="mt-10">
          <PillarCards source="home" />
        </div>

      </Container>
    </section>
  );
}

/**
 * The brief's "Affordable support for real motherhood" (§14).
 *
 * Three proof points rather than the claim alone, because "affordable" asserted
 * on its own is what every marketplace says. Each figure is real: the yoga
 * trial price from /yoga, the community's actual cost, and the seller plan from
 * the shared constants the billing gate enforces.
 *
 * §10's affordability language is deliberate here — accessible and practical,
 * never "cheap" or "low-cost", which the brief says weakens perceived
 * expertise.
 */
export function AffordableSupport() {
  const proof = [
    { figure: "from ₹299", label: "A first yoga session", href: "/yoga" },
    { figure: "Free", label: "The mom community", href: "/community" },
    {
      figure: `from ${formatPaise(MEMBERSHIP_PLANS.MONTHLY.priceInPaise)}`,
      label: "To sell on the marketplace",
      href: "/sell",
    },
  ];

  return (
    <section className="relative">
      <Container className="py-14">
        <div className="relative overflow-visible rounded-[2rem] border-2 border-border bg-surface-2 p-8 sm:p-12">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2rem]"
          >
            <span
              className="absolute -bottom-14 -right-14 h-64 w-64 rounded-full bg-blush/35 blur-3xl"
            />
          </span>
          <div className="pointer-events-none absolute right-2 top-2 z-0 hidden w-48 sm:block lg:right-16 lg:top-[-100] lg:w-72">
            <Image
              src="/images/affordable-support-motherhood.png"
              alt=""
              width={560}
              height={560}
              aria-hidden="true"
              className="relative h-auto w-full object-contain"
            />
          </div>
          <div className="relative z-10">
            <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Affordable support for real motherhood
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Professional guidance, practical resources and thoughtful choices
              designed with moms in mind — priced so that asking for help is
              never the expensive option.
            </p>
            </div>


          <dl className="mt-9 grid gap-4 sm:grid-cols-3">
            {proof.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-[1.5rem] border-2 border-border bg-surface p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-primary/45"
              >
                <dt className="font-display text-2xl font-semibold text-foreground">
                  {item.figure}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-muted-foreground">
                  {item.label}
                </dd>
              </Link>
            ))}
          </dl>
          </div>
        </div>
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
      <Container className="py-16">
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
              Join our community
            </TrackedLink>
            <Link
              href="/about"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Meet the founders
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
