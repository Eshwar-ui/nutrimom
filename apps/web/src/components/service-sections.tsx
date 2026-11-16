import Link from "next/link";
import Image from "next/image";
import { TrackedLink, TrackedExternalLink } from "./tracked-link";
import { MessageCircle, ArrowRight, BadgeCheck, Check, ClipboardCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "./ui/primitives";
import { buttonVariants } from "./ui/button";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";
import { ENQUIRY_SERVICE_SLUGS } from "@/lib/site-nav";
import type { BookingIntent } from "@/lib/booking";

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
      className="mt-8 rounded-panel border border-border bg-surface/70 p-3 sm:p-4"
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
  /** Optional pastel border token for a more illustrated service-card treatment. */
  borderColor?: string;
  /** Optional classes for the grid item wrapper. */
  gridClassName?: string;
  /** Optional classes for the illustrated panel and its image. */
  illustrationClassName?: string;
  illustrationImageClassName?: string;
  /** A compact visual cue that makes the service easier to recognise at a glance. */
  illustration?: {
    primary: LucideIcon;
    secondary?: LucideIcon;
    label: string;
    detail: string;
    surface: string;
    image?: string;
  };
  /** Turns the whole card into a link when this pillar has a deeper page. */
  href?: string;
}

function OfferingIllustration({
  illustration,
  className,
  imageClassName,
  fillHeight = false,
}: {
  illustration: NonNullable<Offering['illustration']>;
  className?: string;
  imageClassName?: string;
  fillHeight?: boolean;
}) {
  const Primary = illustration.primary;
  const Secondary = illustration.secondary;

  return (
    <div
      className={cn(
        "relative mb-5 overflow-hidden rounded-[1.35rem] border border-border/70 p-4",
        illustration.surface,
        className,
        fillHeight && "flex-1",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/45 blur-sm"
      />
      {illustration.image && (
        <Image
          src={illustration.image}
          alt=""
          aria-hidden="true"
          width={180}
          height={180}
          className={cn(
            "pointer-events-none absolute -bottom-5 -right-2 h-28 w-28 object-contain opacity-85",
            imageClassName,
          )}
        />
      )}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/70 text-foreground shadow-sm">
            <Primary className="h-5 w-5" strokeWidth={1.8} />
          </span>
          {Secondary && (
            <>
              <span aria-hidden className="h-px w-4 bg-foreground/20" />
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/55 text-foreground/80">
                <Secondary className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </>
          )}
        </div>
        <span className="max-w-[8rem] text-right text-[0.72rem] font-bold uppercase leading-tight tracking-[0.12em] text-foreground/65">
          {illustration.label}
        </span>
      </div>
      {/* Stops short of the corner illustration, which would otherwise sit on
          the last words of the line in a narrow card. */}
      <p className="relative mt-4 max-w-[min(15rem,calc(100%-5.5rem))] text-xs font-medium leading-relaxed text-foreground/75">
        {illustration.detail}
      </p>
    </div>
  );
}

export function OfferingGrid({
  heading,
  items,
  equalCards = false,
}: {
  heading?: string;
  items: readonly Offering[];
  equalCards?: boolean;
}) {
  return (
    <section className="mt-section">
      {heading && (
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {heading}
        </h2>
      )}
      <div className={cn("grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3", heading && "mt-6")}>
        {items.map((item, i) => {
          const Icon = item.icon;
          const inner = (
            <>
              {item.illustration ? (
                <OfferingIllustration
                  illustration={item.illustration}
                  className={item.illustrationClassName}
                  imageClassName={item.illustrationImageClassName}
                  fillHeight={equalCards}
                />
              ) : (
                Icon && (
                  <span
                    className={cn(
                      "mb-4 grid h-11 w-11 place-items-center rounded-2xl",
                      item.tint ?? "bg-sage/60",
                    )}
                  >
                    <Icon className="h-5 w-5 text-foreground" />
                  </span>
                )
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
            equalCards
              ? "flex h-full min-h-[18rem] flex-col"
              : "block",
            "rounded-card bg-surface p-6 card-shadow transition-transform",
            item.borderColor ? cn("border-2", item.borderColor) : "border border-border",
            item.href && "hover:-translate-y-0.5 hover:border-primary/40",
          );
          return (
            <Reveal
              key={item.title}
              delay={i * 0.04}
              className={cn(equalCards ? "h-full" : undefined, item.gridClassName)}
            >
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

/**
 * The tint-and-ink pairs the paper world is built from.
 *
 * Each ink is the `*-ink` token for its tint (globals.css): the tints are
 * defined identically in light and dark mode, so a fixed dark ink stays
 * correct in both, and every pair clears 5.6:1.
 */
const PASTEL_INK = [
  { tint: "bg-blush", ink: "text-blush-ink" },
  { tint: "bg-sky", ink: "text-sky-ink" },
  { tint: "bg-sage", ink: "text-sage-ink" },
  { tint: "bg-lavender", ink: "text-lavender-ink" },
  { tint: "bg-gold", ink: "text-gold-ink" },
] as const;

/**
 * A checklist — "what a session includes", "what the community covers".
 *
 * One sheet rather than a card each: this is a single list, and both callers
 * pass seven items, which in a two-column grid of cards left the last one
 * stranded in its own row. CSS columns flow and balance it instead, so an odd
 * count reads as a list rather than a layout that ran out.
 *
 * Deliberately not the tinted, tilted stock the prices use — seven rotated
 * notes would fight for the same attention the figures need, and a list is a
 * different kind of thing from a set of options.
 */
export function IncludesList({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <section className="mt-section">
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        {heading}
      </h2>

      <div className="relative mt-8 rounded-card border-2 border-border bg-surface p-7 card-shadow sm:p-9">
        {/* washi tape pinning the sheet */}
        <span
          aria-hidden
          className="absolute -top-3 left-10 h-6 w-24 -rotate-6 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm"
        />
        {/* corner sticker */}
        <span
          aria-hidden
          className="absolute -right-3 -top-3 grid h-11 w-11 rotate-6 place-items-center rounded-full border-2 border-surface bg-sage text-sage-ink"
        >
          <ClipboardCheck className="h-5 w-5" strokeWidth={1.8} />
        </span>

        <ul className="gap-x-10 sm:columns-2">
          {items.map((item, i) => {
            const swatch = PASTEL_INK[i % PASTEL_INK.length];
            return (
              <li
                key={item}
                className="flex break-inside-avoid gap-3.5 py-3 text-sm leading-relaxed text-foreground"
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
                    swatch.tint,
                    swatch.ink,
                  )}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
                {item}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Wellness services are not medical care; every service page has to say so. */
export function SafetyNote({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-section rounded-card border border-border bg-muted/50 p-6">
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
  /** The funnel keyword this CTA belongs to, recorded against the click so
   *  §16's "WhatsApp keyword conversions" can be read per service. */
  intent,
}: {
  label: string;
  whatsappUrl: string | null;
  secondary?: { href: string; label: string };
  intent?: BookingIntent;
}) {
  // Both branches are measured, not just the WhatsApp one: while the operator
  // has no support phone every booking falls back to the contact form, and a
  // funnel that only counts the branch that isn't running yet reads as zero
  // demand rather than as an unconfigured number.
  const props = { intent: intent ?? "unknown", via: whatsappUrl ? "whatsapp" : "contact_form" };
  // The fallback carries the same attribution the WhatsApp keyword does.
  // Without it every booking made while `supportPhone` is blank — which is
  // every booking today — arrives in admin → Messages indistinguishable from
  // someone asking about a delivery.
  const contactHref = intent
    ? `/contact?service=${ENQUIRY_SERVICE_SLUGS[intent]}`
    : "/contact";

  return (
    <>
      {whatsappUrl ? (
        <TrackedExternalLink
          event="booking_cta_click"
          eventProps={props}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <MessageCircle className="h-4 w-4" /> {label}
        </TrackedExternalLink>
      ) : (
        <TrackedLink
          event="booking_cta_click"
          eventProps={props}
          href={contactHref}
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          {label}
        </TrackedLink>
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
  decorations,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
  decorations?: readonly { src: string; className: string }[];
}) {
  return (
    <section className="relative mt-20 overflow-hidden rounded-panel border border-border bg-surface-2 py-14">
      {/* Floating illustrations need room either side of the copy, which only
          exists once the card is desktop-wide. Below xl they would sit on the
          heading (at 1024px the yoga art still clips the subtitle), so there
          they drop into a small row above it instead, and each page's
          `className` positions only apply from xl up. */}
      {decorations?.map((decoration) => (
        <Image
          key={decoration.src}
          src={decoration.src}
          alt=""
          aria-hidden="true"
          width={180}
          height={180}
          className={cn(
            "pointer-events-none absolute hidden h-auto object-contain opacity-90 xl:block",
            decoration.className,
          )}
        />
      ))}
      {decorations && decorations.length > 0 && (
        <div aria-hidden="true" className="mb-6 flex items-end justify-center gap-3 px-6 xl:hidden">
          {decorations.map((decoration) => (
            <Image
              key={decoration.src}
              src={decoration.src}
              alt=""
              width={180}
              height={180}
              className="h-24 w-auto object-contain sm:h-28"
            />
          ))}
        </div>
      )}
      <Container className="relative z-10 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>
      </Container>
    </section>
  );
}
