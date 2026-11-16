import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  SERVICE_GROUP_LABELS,
  formatPaise,
  resolvePackagePrice,
  type ServicePackage,
} from "@nutrimom/shared";
import { TrackedLink } from "./tracked-link";
import { Reveal } from "./reveal";
import { buttonVariants } from "./ui/button";
import { PILLARS, type PillarKey } from "@/lib/site-nav";
import type { AnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * The home page's four service sections (brief §2): photo, short description
 * and buttons, given equal weight so the page reads as four services rather
 * than a shop with extras. Titles and descriptions come from PILLARS, the
 * same source /about's pillar cards use.
 */

interface ServiceAction {
  label: string;
  href: string;
  variant: "primary" | "outline";
  event: AnalyticsEvent;
  eventProps: Record<string, string>;
}

/*
 * PLACEHOLDER ART — the client is to supply genuine photos for each of the
 * four services (REDESIGN-PLAN "Needed from the client" #1). These are the
 * brand's own illustrations, used until then. When a photograph replaces one,
 * set `fit: "cover"` so it fills the frame instead of floating on the tint.
 */
const SERVICE_ART: Record<
  PillarKey,
  { src: string; alt: string; tint: string; fit: "contain" | "cover" }
> = {
  move: {
    src: "/images/yoga/prenatal-yoga.webp",
    alt: "Illustration of a pregnant mother doing a gentle seated stretch on a yoga mat",
    tint: "bg-sage/35",
    fit: "contain",
  },
  nourish: {
    src: "/images/pillars/pillar-nourish.webp",
    alt: "Illustration of a bowl of fruit, leafy greens and grains",
    tint: "bg-beige/70",
    fit: "contain",
  },
  connect: {
    src: "/images/pillars/pillar-connect.webp",
    alt: "Illustration of three mothers chatting together, one holding her baby",
    tint: "bg-sky/60",
    fit: "contain",
  },
  "pass-it-on": {
    src: "/images/pillars/pillar-pass-it-on.webp",
    alt: "Illustration of a pram holding a teddy bear and a folded blanket",
    tint: "bg-blush/45",
    fit: "contain",
  },
};

/** The brief's buttons, word for word (§2, §7). */
function actionsFor(key: PillarKey, href: string, cta: string): ServiceAction[] {
  if (key === "pass-it-on") {
    return [
      { label: "Shop Preloved", href: "/listings", variant: "primary", event: "preloved_click", eventProps: { action: "shop", placement: "home_services" } },
      { label: "Sell an Item", href: "/sell", variant: "outline", event: "preloved_click", eventProps: { action: "sell", placement: "home_services" } },
      { label: "Donate an Item", href: "/preloved/donate", variant: "outline", event: "preloved_click", eventProps: { action: "donate", placement: "home_services" } },
    ];
  }
  return [
    { label: cta, href, variant: "primary", event: "pillar_click", eventProps: { pillar: key, to: href, source: "home" } },
  ];
}

export function ServiceShowcase() {
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {PILLARS.map((pillar, i) => {
        const art = SERVICE_ART[pillar.key];
        const actions = actionsFor(pillar.key, pillar.href, pillar.cta);
        return (
          <li key={pillar.key} className="list-none">
            <Reveal delay={(i % 2) * 0.06} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-card border-2 border-border bg-surface card-shadow">
                <div className={cn("relative aspect-[16/10] xl:aspect-[2/1]", art.tint)}>
                  <Image
                    src={art.src}
                    alt={art.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={art.fit === "cover" ? "object-cover" : "object-contain p-5 sm:p-6"}
                  />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-text">
                    {pillar.eyebrow}
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-foreground">
                    <Link href={pillar.href} className="hover:text-primary hover:underline hover:decoration-primary/40 hover:underline-offset-4">
                      {pillar.title}
                    </Link>
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{pillar.blurb}</p>
                  <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
                    {actions.map((action) => (
                      <TrackedLink
                        key={action.href}
                        event={action.event}
                        eventProps={action.eventProps}
                        href={action.href}
                        className={buttonVariants({ variant: action.variant })}
                      >
                        {action.label}
                      </TrackedLink>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A one-line pointer to the yoga page's best-value package. Picks the COMBO
 * package flagged best value (else the first active one) and prices it through
 * resolvePackagePrice, the same helper the yoga page's cards use — so a live
 * offer shows here exactly as it does there. Renders nothing without one.
 */
export function BestValueTeaser({
  packages,
  href,
}: {
  packages: readonly ServicePackage[];
  href: string;
}) {
  const pkg = packages.find((p) => p.isBestValue) ?? packages[0];
  if (!pkg) return null;
  const price = resolvePackagePrice(pkg);
  const name = `${SERVICE_GROUP_LABELS[pkg.group]} ${pkg.name}`;

  return (
    <TrackedLink
      event="pillar_click"
      eventProps={{ pillar: "move", to: href, source: "home", placement: "best_value" }}
      href={href}
      className="group mt-6 flex flex-col gap-4 rounded-card border-2 border-gold/60 bg-gold/15 p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-gold sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-gold-ink">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground/80">
            Best value
          </p>
          <p className="mt-0.5 font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {name}
          </p>
          {pkg.summary && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pkg.summary}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-5 pl-[3.75rem] sm:pl-0">
        <p className="text-right">
          {price.label === "SPECIAL_OFFER" && price.offerLabel && (
            <span className="block text-xs font-bold text-accent-text">{price.offerLabel}</span>
          )}
          {price.label === "INTRODUCTORY" && (
            <span className="block text-xs font-bold text-accent-text">Introductory price</span>
          )}
          <span className="font-display text-2xl font-semibold text-foreground">
            {formatPaise(price.pricePaise)}
          </span>
          {price.compareAtPaise !== undefined && (
            <s className="ml-2 text-sm text-muted-foreground">
              <span className="sr-only">Regular price </span>
              {formatPaise(price.compareAtPaise)}
            </s>
          )}
        </p>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-accent-text">
          See packages
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </TrackedLink>
  );
}
