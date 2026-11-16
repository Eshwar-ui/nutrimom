import { MessageCircle, Sparkles } from "lucide-react";
import {
  SERVICE_GROUP_LABELS,
  type ServiceGroup,
  type ServicePackage,
} from "@nutrimom/shared";
import { ServicePackageCard } from "./service-package-card";
import { TrackedExternalLink, TrackedLink } from "./tracked-link";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { packageEnquiryHref, packageWhatsappUrl } from "@/lib/booking";

/**
 * Book Now + Enquire for one package (REDESIGN-PLAN decision 1: no online
 * payment for sessions).
 *
 * Book Now opens WhatsApp prefilled with the package and its current price;
 * while the operator has no support phone it falls back to the enquiry form,
 * exactly like BookingCta does, rather than rendering a dead `wa.me/` link.
 * Enquire always goes to the form with the package attached — the API looks
 * the package up and snapshots the price itself.
 *
 * The visible text is the same on every card, so each link's accessible name
 * adds the package and its group ("Single Session" exists under both
 * Garbhasanskar and 1:1) while still starting with the words on the button.
 */
function PackageActions({
  pkg,
  phone,
  now,
}: {
  pkg: ServicePackage;
  phone: string | null;
  now: Date;
}) {
  const enquiryHref = packageEnquiryHref(pkg);
  const who = `${pkg.name}, ${SERVICE_GROUP_LABELS[pkg.group]}`;
  const bookProps = {
    packageId: pkg.id,
    group: pkg.group,
    via: phone ? "whatsapp" : "contact_form",
  };
  const enquireProps = { packageId: pkg.id, group: pkg.group };

  return (
    <>
      {phone ? (
        <TrackedExternalLink
          event="package_book_click"
          eventProps={bookProps}
          href={packageWhatsappUrl(phone, pkg, now)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Book Now: ${who} (opens WhatsApp)`}
          className={cn(buttonVariants(), "flex-1")}
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> Book Now
        </TrackedExternalLink>
      ) : (
        <TrackedLink
          event="package_book_click"
          eventProps={bookProps}
          href={enquiryHref}
          aria-label={`Book Now: ${who}`}
          className={cn(buttonVariants(), "flex-1")}
        >
          Book Now
        </TrackedLink>
      )}
      <TrackedLink
        event="package_enquire_click"
        eventProps={enquireProps}
        href={enquiryHref}
        aria-label={`Enquire: ${who}`}
        className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
      >
        Enquire
      </TrackedLink>
    </>
  );
}

/**
 * The public price grid for the service pages, rendered from the admin-edited
 * ServicePackage rows — no page carries a price of its own any more, so every
 * session price is edited in one place (REDESIGN-PLAN Phase 3).
 *
 * Groups render in the order the page passes, each under its
 * SERVICE_GROUP_LABELS heading. With `featureBestValue`, the first package
 * flagged Best value is lifted out into a wide "Recommended" block above the
 * groups — first in the DOM, so it is also first on a phone and first for a
 * screen reader, rather than reordered visually with CSS. A group left empty
 * by that is skipped.
 *
 * Renders nothing when none of the groups has a package: an unreachable API
 * reads as an empty list (lib/content.ts), and the page keeps its enquiry CTA
 * rather than falling back to hardcoded prices.
 */
export function PackagePricing({
  id = "packages",
  heading,
  intro,
  packages,
  groups,
  groupCopy = {},
  phone,
  featureBestValue = false,
  footnote,
  children,
}: {
  /** Anchor for in-page links ("See prices"). */
  id?: string;
  heading: string;
  intro?: React.ReactNode;
  packages: readonly ServicePackage[];
  /** Which groups to show, in page order. */
  groups: readonly ServiceGroup[];
  /** One line under each group heading (the brief's per-service copy). */
  groupCopy?: Partial<Record<ServiceGroup, string>>;
  /** The operator's WhatsApp number, or null to send Book Now to the form. */
  phone: string | null;
  featureBestValue?: boolean;
  /** Small print under the grid. */
  footnote?: React.ReactNode;
  /** Rendered below the grid — the session policy, a "not sure?" line. */
  children?: React.ReactNode;
}) {
  // One clock for the whole grid, so every card and every WhatsApp message on
  // the page agrees on whether an offer is still live.
  const now = new Date();

  const featured = featureBestValue
    ? packages.find((p) => p.isBestValue && groups.includes(p.group)) ?? null
    : null;

  const sections = groups
    .map((group) => ({
      group,
      items: packages.filter((p) => p.group === group && p.id !== featured?.id),
    }))
    .filter((s) => s.items.length > 0);

  if (!featured && sections.length === 0) return null;

  // A lone group needs no heading of its own — the section heading already
  // names it — and its cards' titles move up a level to match.
  const showGroupHeadings = sections.length + (featured ? 1 : 0) > 1;

  // The brief's group line and a package summary sometimes say the same thing
  // (the seeded 1:1 packages do); printing it twice in a row reads as a bug.
  const summaryFor = (pkg: ServicePackage) =>
    groupCopy[pkg.group]?.trim() === pkg.summary.trim() ? "" : pkg.summary;

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mt-section scroll-mt-24">
      <div className="max-w-2xl">
        <h2
          id={`${id}-heading`}
          className="font-display text-2xl font-semibold text-foreground sm:text-3xl"
        >
          {heading}
        </h2>
        {intro && (
          <p className="mt-3 leading-relaxed text-muted-foreground">{intro}</p>
        )}
      </div>

      {featured && (
        <div className="mt-8 rounded-panel bg-sage/30 p-3 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pb-6 pt-1 sm:px-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sage-ink">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Recommended
            </span>
            {groupCopy[featured.group] && (
              <p className="text-sm text-sage-ink">{groupCopy[featured.group]}</p>
            )}
          </div>
          <ServicePackageCard
            pkg={{ ...featured, summary: summaryFor(featured) }}
            now={now}
            layout="wide"
            className="shadow-pop"
            actions={<PackageActions pkg={featured} phone={phone} now={now} />}
          />
        </div>
      )}

      <div className={cn("space-y-12", featured ? "mt-12" : "mt-8")}>
        {sections.map(({ group, items }) => {
          const single = items.length === 1;
          const cards = (
            <div className={cn("grid gap-5", !single && "sm:grid-cols-2")}>
              {items.map((pkg) => (
                <ServicePackageCard
                  key={pkg.id}
                  pkg={{ ...pkg, summary: summaryFor(pkg) }}
                  now={now}
                  layout={single ? "wide" : "stack"}
                  showGroup={!showGroupHeadings}
                  titleAs={showGroupHeadings ? "h4" : "h3"}
                  actions={<PackageActions pkg={pkg} phone={phone} now={now} />}
                />
              ))}
            </div>
          );

          if (!showGroupHeadings) return <div key={group}>{cards}</div>;

          return (
            <div
              key={group}
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)] lg:gap-10"
            >
              <div className="lg:pt-2">
                <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                  {SERVICE_GROUP_LABELS[group]}
                </h3>
                {groupCopy[group] && (
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {groupCopy[group]}
                  </p>
                )}
              </div>
              {cards}
            </div>
          );
        })}
      </div>

      {footnote && (
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          {footnote}
        </p>
      )}

      {children}
    </section>
  );
}
