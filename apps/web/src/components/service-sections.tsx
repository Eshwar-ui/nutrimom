import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";
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
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
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
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
      {children && <div className="mt-7 flex flex-wrap gap-3">{children}</div>}
    </header>
  );
}

/** A row of short trust signals — certifications, training, credentials. */
export function CredentialStrip({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-8 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
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
  price: string;
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
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        {heading}
      </h2>
      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={cn(i > 0 && "border-t border-border")}>
                <th
                  scope="row"
                  className="px-5 py-3.5 text-left font-semibold text-foreground"
                >
                  {row.label}
                </th>
                <td className="px-5 py-3.5 text-right text-muted-foreground">
                  {row.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
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
