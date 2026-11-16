import Link from "next/link";
import { ClipboardList } from "lucide-react";
import {
  SERVICE_GROUP_LABELS,
  formatPaise,
  resolvePackagePrice,
  type ServiceGroup,
  type ServicePackage,
} from "@nutrimom/shared";

/** Where each group's price grid lives, for "Change package". */
const GROUP_PAGE: Record<ServiceGroup, string> = {
  PRENATAL_YOGA: "/yoga#packages",
  GARBHASANSKAR: "/yoga#packages",
  COMBO: "/yoga#packages",
  ONE_TO_ONE_YOGA: "/yoga#packages",
  NUTRITION: "/nutrition#packages",
  STARTING_SOLIDS: "/nutrition/starting-solids#packages",
};

/**
 * "You're asking about …" above the contact form, when an Enquire button sent
 * the visitor here with `?package=`. The price is resolvePackagePrice's — the
 * same figure the card showed and the one the API snapshots onto the enquiry
 * at submit time — so the three can't disagree.
 */
export function PackageEnquirySummary({ pkg }: { pkg: ServicePackage }) {
  const price = resolvePackagePrice(pkg);

  return (
    <div className="mb-6 flex flex-col gap-5 rounded-card border-2 border-primary/30 bg-surface p-5 card-shadow sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage/50 text-sage-ink">
          <ClipboardList className="h-6 w-6" strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            You&apos;re asking about
          </p>
          <p className="mt-1 font-display text-xl font-semibold leading-tight text-foreground">
            {pkg.name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {SERVICE_GROUP_LABELS[pkg.group]} ·{" "}
            <Link
              href={GROUP_PAGE[pkg.group]}
              className="font-semibold text-accent-text underline-offset-4 hover:underline"
            >
              Change package
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4 sm:border-t-0 sm:pt-0 sm:text-right">
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
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 sm:justify-end">
          <span
            className={
              price.label === "SPECIAL_OFFER"
                ? "font-display text-3xl font-semibold text-accent-text"
                : "font-display text-3xl font-semibold text-foreground"
            }
          >
            {formatPaise(price.pricePaise)}
          </span>
          {price.compareAtPaise !== undefined && (
            <s className="text-base text-muted-foreground">
              <span className="sr-only">Regular price </span>
              {formatPaise(price.compareAtPaise)}
            </s>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          We&apos;ll note this package and price with your message.
        </p>
      </div>
    </div>
  );
}
