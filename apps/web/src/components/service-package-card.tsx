import { CalendarDays, Check, Clock3, Hourglass, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SERVICE_GROUP_LABELS,
  SESSION_FORMAT_LABELS,
  formatPaise,
  resolvePackagePrice,
  type PackagePriceFields,
  type ServiceGroup,
  type SessionFormat,
} from "@nutrimom/shared";
import { cn } from "@/lib/utils";

/** What the card reads — satisfied by a ServicePackage and by the admin form's draft. */
export type PackageCardData = PackagePriceFields & {
  group: ServiceGroup;
  name: string;
  summary: string;
  includes: string[];
  sessionCount?: number | null;
  sessionMinutes?: number | null;
  validityDays?: number | null;
  format: SessionFormat;
  isBestValue?: boolean;
};

// Dates are shown in IST whatever the server's zone — an offer ending at
// 11:59 pm in India must not read as the next day on a UTC render. The year is
// added only when it isn't this one: "Offer ends 12 Dec" is the brief's
// format, but an offer running into January must not read as eleven months ago.
const IST = "Asia/Kolkata";
function fmtOfferEnd(iso: string, now: Date): string {
  const end = new Date(iso);
  const year = (d: Date) => d.toLocaleDateString("en-IN", { year: "numeric", timeZone: IST });
  return end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(year(end) !== year(now) ? { year: "numeric" } : {}),
    timeZone: IST,
  });
}

/**
 * The package's facts, each only when it has a value — a card never shows a
 * duration or validity the admin didn't enter (brief §8). Format is required
 * on every package, so it is always there.
 */
function packageFacts(pkg: PackageCardData): { icon: LucideIcon; text: string }[] {
  return [
    pkg.sessionCount
      ? { icon: CalendarDays, text: `${pkg.sessionCount} ${pkg.sessionCount === 1 ? "session" : "sessions"}` }
      : null,
    pkg.sessionMinutes ? { icon: Clock3, text: `${pkg.sessionMinutes} min each` } : null,
    pkg.validityDays
      ? { icon: Hourglass, text: `Valid ${pkg.validityDays} ${pkg.validityDays === 1 ? "day" : "days"}` }
      : null,
    { icon: Users, text: SESSION_FORMAT_LABELS[pkg.format] },
  ].filter((f): f is { icon: LucideIcon; text: string } => f !== null);
}

/**
 * One package's price card. Every price shown comes from resolvePackagePrice
 * (shared), so this card, the WhatsApp booking message and the enquiry
 * snapshot can never disagree. Brief §9: a live offer shows the regular price
 * struck through, the offer price, its label, the computed savings and the end
 * date; an introductory price has its own label and never a strikethrough.
 *
 * Presentational and hook-free, so it renders on the server for the public
 * pages and inside the admin editor as a live preview. `actions` is the
 * button row (Book Now / Enquire) — the caller owns what those do.
 *
 * `layout="wide"` puts the price and actions in a column beside the details
 * from `md` up — used for the recommended package and for a group with a
 * single package, where one narrow card in a grid reads as a failed load.
 * `showGroup={false}` drops the group eyebrow when the card already sits under
 * that group's heading, and `titleAs="h4"` keeps the outline correct there.
 */
export function ServicePackageCard({
  pkg,
  now = new Date(),
  actions,
  className,
  layout = "stack",
  showGroup = true,
  titleAs: Title = "h3",
}: {
  pkg: PackageCardData;
  now?: Date;
  actions?: React.ReactNode;
  className?: string;
  layout?: "stack" | "wide";
  showGroup?: boolean;
  /** h4 when the card sits under a group's own h3. */
  titleAs?: "h3" | "h4";
}) {
  const price = resolvePackagePrice(pkg, now);
  const facts = packageFacts(pkg);
  const wide = layout === "wide";

  const priceBlock = (
    <div>
      {price.label === "SPECIAL_OFFER" && (
        <span className="inline-flex rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-accent-text">
          {price.offerLabel}
        </span>
      )}
      {price.label === "INTRODUCTORY" && (
        <span className="inline-flex rounded-full bg-gold/25 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-gold-ink">
          Introductory Price
        </span>
      )}
      <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "font-display text-4xl font-semibold tracking-[-0.02em]",
            price.label === "SPECIAL_OFFER" ? "text-accent-text" : "text-foreground",
          )}
        >
          {price.label === "SPECIAL_OFFER" && <span className="sr-only">Offer price </span>}
          {formatPaise(price.pricePaise)}
        </span>
        {price.compareAtPaise !== undefined && (
          <s className="text-lg text-muted-foreground">
            <span className="sr-only">Regular price </span>
            {formatPaise(price.compareAtPaise)}
          </s>
        )}
      </p>
      {price.savingsPaise !== undefined && (
        <p className="mt-1 text-sm font-semibold text-accent-text">
          Save {formatPaise(price.savingsPaise)} ({price.savingsPct}%)
        </p>
      )}
      {price.offerEndsAt && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Offer ends {fmtOfferEnd(price.offerEndsAt, now)}
        </p>
      )}
    </div>
  );

  const details = (
    <>
      {showGroup && (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {SERVICE_GROUP_LABELS[pkg.group]}
        </p>
      )}
      <Title
        className={cn(
          "font-display font-semibold leading-tight text-foreground",
          wide ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
          showGroup && "mt-1.5",
        )}
      >
        {pkg.name || "Package name"}
      </Title>
      {pkg.summary && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pkg.summary}</p>
      )}

      {facts.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Package details">
          {facts.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      )}

      {pkg.includes.length > 0 && (
        <ul className={cn("mt-4 space-y-2", wide && "sm:columns-2 sm:gap-x-6 sm:space-y-0")}>
          {pkg.includes.map((item, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 text-sm leading-relaxed text-foreground",
                wide && "sm:break-inside-avoid sm:py-1",
              )}
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <article
      className={cn(
        "relative h-full rounded-card border bg-surface card-shadow",
        pkg.isBestValue ? "border-2 border-primary" : "border-border",
        wide
          ? "grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-8"
          : "flex flex-col p-6",
        pkg.isBestValue && "pt-8",
        className,
      )}
    >
      {pkg.isBestValue && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Best value
        </span>
      )}

      {wide ? (
        <>
          <div className="min-w-0">{details}</div>
          <div className="flex min-w-0 flex-col border-t border-border pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            {priceBlock}
            {actions && <div className="mt-6 flex flex-wrap gap-2 md:mt-auto md:pt-6">{actions}</div>}
          </div>
        </>
      ) : (
        <>
          {details}
          {/* Pinned to the bottom so the prices and buttons line up across a
              row of cards, whatever each one's list of inclusions runs to. */}
          <div className="mt-auto pt-5">
            <div className="border-t border-border pt-5">{priceBlock}</div>
            {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
          </div>
        </>
      )}
    </article>
  );
}
