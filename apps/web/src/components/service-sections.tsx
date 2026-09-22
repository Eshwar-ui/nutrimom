import Link from "next/link";
import { MessageCircle, ArrowRight, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "./ui/primitives";
import { buttonVariants } from "./ui/button";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the four pillar pages (/yoga, /nutrition,
 * /nutrition/starting-solids, /community, /preloved).
 *
 * They exist so the pillars read as one product rather than five pages built
 * on five different weeks, and so the Phase 2 visual pass restyles them in one
 * place instead of five. The card grammar deliberately echoes the marketplace's
 * listing cards, per the founders' brief (§13).
 */

export function ServiceHero({
  eyebrow,
  title,
  subtitle,
  subtitleClassName,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  /**
   * Extra classes for the subtitle — the pillars that sit on top of a hero
   * illustration cap its width so the copy wraps before it reaches the art.
   */
  subtitleClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
        {title}
      </h1>
      <p
        className={cn(
          "mt-4 text-lg leading-relaxed text-muted-foreground",
          subtitleClassName,
        )}
      >
        {subtitle}
      </p>
      {children && <div className="mt-7 flex flex-wrap gap-3">{children}</div>}
    </header>
  );
}

/** A row of short trust signals — certifications, training, credentials. */
export function CredentialStrip({ items }: { items: readonly string[] }) {
  return (
    <section
      aria-label="Credentials"
      className="mt-8 rounded-3xl border border-border bg-surface/70 p-3 sm:p-4"
    >
      <div className="flex items-center gap-2 px-2 pb-3">
        <BadgeCheck className="h-4 w-4 text-accent-text" strokeWidth={1.8} />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-text">
          Credentials
        </p>
      </div>
      <ul className="grid overflow-hidden rounded-2xl bg-background/70 sm:grid-cols-3 sm:divide-x sm:divide-border">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 border-t border-border px-4 py-4 first:border-t-0 sm:border-t-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sage/45 text-foreground">
              <BadgeCheck className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="text-sm font-semibold leading-snug text-foreground">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface Offering {
  title: string;
  body: string;
  icon?: LucideIcon;
  tint?: string;
  /** Turns the whole card into a link when this pillar has a deeper page. */
  href?: string;
}

export function OfferingGrid({
  heading,
  items,
}: {
  heading?: string;
  items: readonly Offering[];
}) {
  return (
    <section className="mt-14">
      {heading && (
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {heading}
        </h2>
      )}
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", heading && "mt-6")}>
        {items.map((item, i) => {
          const Icon = item.icon;
          const inner = (
            <>
              {Icon && (
                <span
                  className={cn(
                    "mb-4 grid h-11 w-11 place-items-center rounded-2xl",
                    item.tint ?? "bg-sage/60",
                  )}
                >
                  <Icon className="h-5 w-5 text-foreground" />
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              {item.href && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text">
                  Learn more <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </>
          );
          const className = cn(
            "block rounded-2xl border border-border bg-surface p-6 card-shadow transition-transform",
            item.href && "hover:-translate-y-0.5 hover:border-primary/40",
          );
          return (
            <Reveal key={item.title} delay={i * 0.04}>
              {item.href ? (
                <Link href={item.href} className={className}>
                  {inner}
                </Link>
              ) : (
                <div className={className}>{inner}</div>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/** A plain checklist — "what a session includes", "what the community covers". */
export function IncludesList({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        {heading}
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-muted-foreground"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface PriceRow {
  label: string;
  /** The figure alone — "₹799". The "from" qualifier is `from`, not prose. */
  price: string;
  /** Marks a starting price, so the qualifier is set in type rather than
   *  buried at the same size as the number it changes the meaning of. */
  from?: boolean;
  /** What the figure buys — "per class", "per month". Without it a ₹199 class
   *  rate sits beside a ₹799 monthly batch as though they were comparable. */
  unit?: string;
}

/**
 * Prices are shown as "starting from" ranges, because the founders' brief
 * (§10) flags every figure in it as a planning range rather than a published
 * fee. The note under the table says so in the visitor's words rather than
 * leaving them to discover it at checkout.
 */
export function PricingTable({
  heading = "Pricing",
  rows,
  note,
}: {
  heading?: string;
  rows: readonly PriceRow[];
  note?: string;
}) {
  // One price is a statement, several are a comparison. A lone row in a
  // three-column grid reads as two missing cards, so it gets the wider
  // treatment instead of a third of a row.
  const single = rows.length === 1;

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        {heading}
      </h2>

      <div
        className={cn(
          "mt-6 grid gap-4",
          !single && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              // The home page's card language — same radius, border weight and
              // shadow. No hover lift: unlike the pillar and stage cards these
              // are not links, and a card that rises under the cursor promises
              // a click that never happens.
              "relative overflow-hidden rounded-[1.75rem] border-2 border-border bg-surface card-shadow",
              single ? "p-8 sm:flex sm:items-end sm:justify-between sm:gap-8" : "flex flex-col p-6",
            )}
          >
            {single && (
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-sage/40 blur-2xl"
              />
            )}
            <h3
              className={cn(
                "relative text-xs font-bold uppercase tracking-[0.08em] text-accent-text",
                single && "sm:text-sm",
              )}
            >
              {row.label}
            </h3>
            <p
              className={cn(
                "relative flex items-baseline gap-1.5",
                single ? "mt-3 sm:mt-0" : "mt-auto pt-5",
              )}
            >
              {row.from && (
                <span className="text-sm font-semibold text-muted-foreground">
                  from
                </span>
              )}
              <span
                className={cn(
                  "font-display font-semibold leading-none tracking-[-0.02em] text-foreground",
                  single ? "text-4xl sm:text-5xl" : "text-3xl",
                )}
              >
                {row.price}
              </span>
              {row.unit && (
                <span className="text-sm font-semibold text-muted-foreground">
                  {row.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {note && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
    </section>
  );
}

/** Wellness services are not medical care; every service page has to say so. */
export function SafetyNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-14 rounded-2xl border border-border bg-muted/50 p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Before you join a session
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </aside>
  );
}

/**
 * The primary action on a service page.
 *
 * `whatsappUrl` is null until the operator fills in a support phone at
 * /admin/settings, so the button falls back to the on-site enquiry form rather
 * than rendering a dead `wa.me/` link.
 */
export function BookingCta({
  label,
  whatsappUrl,
  secondary,
}: {
  label: string;
  whatsappUrl: string | null;
  secondary?: { href: string; label: string };
}) {
  return (
    <>
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <MessageCircle className="h-4 w-4" /> {label}
        </a>
      ) : (
        <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
          {label}
        </Link>
      )}
      {secondary && (
        <Link
          href={secondary.href}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          {secondary.label}
        </Link>
      )}
    </>
  );
}

/** Closing band shared by the pillar pages. */
export function ClosingCta({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20 rounded-3xl border border-border bg-surface-2 py-14">
      <Container className="max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>
      </Container>
    </section>
  );
}
