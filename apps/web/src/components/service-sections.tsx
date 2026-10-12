import Link from "next/link";
import Image from "next/image";
import { TrackedLink, TrackedExternalLink } from "./tracked-link";
import { MessageCircle, ArrowRight, BadgeCheck, Tag, Check, ClipboardCheck } from "lucide-react";
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
    <section className="mt-14">
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
            "rounded-2xl bg-surface p-6 card-shadow transition-transform",
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
 * The pastel-and-ink pairs the paper world is built from.
 *
 * The ink is a fixed dark tone rather than a token because the pastel under it
 * is defined identically in light and dark mode, so dark ink stays correct in
 * both — the same reason the home page's testimonial stickers do it.
 */
const PASTEL_INK = [
  { tint: "bg-blush", ink: "text-[#7a2447]" },
  { tint: "bg-sky", ink: "text-[#215172]" },
  { tint: "bg-sage", ink: "text-[#2f5236]" },
  { tint: "bg-lavender", ink: "text-[#4a3170]" },
  { tint: "bg-gold", ink: "text-[#5c4410]" },
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
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        {heading}
      </h2>

      <div className="relative mt-8 rounded-[1.75rem] border-2 border-border bg-surface p-7 card-shadow sm:p-9">
        {/* washi tape pinning the sheet */}
        <span
          aria-hidden
          className="absolute -top-3 left-10 h-6 w-24 -rotate-6 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm"
        />
        {/* corner sticker */}
        <span
          aria-hidden
          className="absolute -right-3 -top-3 grid h-11 w-11 rotate-6 place-items-center rounded-full border-2 border-surface bg-sage text-[#2f5236]"
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
/**
 * Paper stock for the price notes — the same vocabulary as the home page's
 * testimonial cards: a tinted sheet, a slight rotation that straightens under
 * the cursor, washi tape and a corner sticker. Cycled by index so the
 * component takes any number of prices without a per-page palette.
 *
 * The sticker's ink is a fixed dark tone rather than a token because the
 * pastel it sits on is defined identically in light and dark mode, so a dark
 * ink stays correct in both — the same reason the testimonial cards do it.
 */
const PRICE_PAPERS = [
  { paper: "bg-blush/45", rotate: "-rotate-2" },
  { paper: "bg-sky/50", rotate: "rotate-1" },
  { paper: "bg-sage/45", rotate: "-rotate-1" },
  { paper: "bg-lavender/45", rotate: "rotate-2" },
  { paper: "bg-beige", rotate: "-rotate-1" },
] as const;

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
  // three-column row reads as two missing cards, so it gets the wider
  // treatment instead of a third of a row.
  const single = rows.length === 1;

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        {heading}
      </h2>

      {/* Centred wrap rather than a grid: five prices in three columns left an
          empty third on the second row, and the block read as a failed load.
          Wrapping and centring balances whatever the last row holds, for any
          number of prices. Bases are computed against the gap so the cards
          still line up in columns. */}
      <div
        className={cn(
          "mt-8 flex flex-wrap justify-center gap-5",
          single && "block",
        )}
      >
        {rows.map((row, i) => {
          const stock = PRICE_PAPERS[i % PRICE_PAPERS.length];
          return (
            <div
              key={row.label}
              className={cn(
                "relative rounded-[1.75rem] border-2 border-border card-shadow",
                single
                  ? "overflow-hidden bg-surface p-8 sm:flex sm:items-end sm:justify-between sm:gap-8"
                  : cn(
                      // Nothing is clipped here: the tape and the sticker are
                      // meant to sit off the sheet, the way they would if
                      // someone had actually stuck them on.
                      "flex basis-full flex-col p-7 pt-9 transition-transform duration-500",
                      "[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:rotate-0",
                      "sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-2.5rem)/3)]",
                      stock.paper,
                      stock.rotate,
                    ),
              )}
            >
              {single ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-sage/40 blur-2xl"
                />
              ) : (
                <>
                  {/* washi tape pinning the note */}
                  <span
                    aria-hidden
                    className="absolute -top-3 left-8 h-6 w-20 -rotate-6 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm"
                  />
                  {/* corner sticker */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -right-3 -top-3 grid h-11 w-11 rotate-6 place-items-center rounded-full border-2 border-surface",
                      PASTEL_INK[i % PASTEL_INK.length].tint,
                      PASTEL_INK[i % PASTEL_INK.length].ink,
                    )}
                  >
                    <Tag className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  {/* oversized currency glyph, the note's watermark */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-3 right-5 select-none font-display text-7xl leading-none text-foreground/[0.07]"
                  >
                    ₹
                  </span>
                </>
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
                  single ? "mt-3 sm:mt-0" : "mt-auto pt-6",
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
          );
        })}
      </div>

      {note && (
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
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
    <section className="relative mt-20 overflow-hidden rounded-3xl border border-border bg-surface-2 py-14">
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
