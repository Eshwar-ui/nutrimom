import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The brand logo is a single artwork: /logo.svg (emblem + wordmark + ribbon).
 * These are framings of that real logo — never invented marks.
 *
 * - FullLogo  → the complete artwork, for roomy light surfaces (footer, hero).
 * - LogoEmblem → the heart-circle emblem alone (text cropped out) for nav /
 *   avatars / small sizes, where the full wordmark would be unreadable.
 */

export function FullLogo({
  className,
  alt = "The Nurture Moms",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt={alt} className={cn("h-auto w-full", className)} />
  );
}

export function LogoEmblem({
  className,
  badgeClassName,
  scale = 1.82,
  origin = "50% 30%",
}: {
  className?: string;
  badgeClassName?: string;
  scale?: number;
  origin?: string;
}) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-surface ring-2 ring-accent/30",
        badgeClassName,
      )}
    >
      {/* Zoom into the emblem (heart + mother & baby), cropping the wordmark. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt=""
        aria-hidden
        className={cn("h-full w-full object-cover", className)}
        style={{ transform: `scale(${scale})`, transformOrigin: origin }}
      />
    </span>
  );
}

/** Horizontal lockup (emblem + wordmark) — the nav logo. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="The Nurture Moms home"
      className={cn("group inline-flex items-center", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-horizontal.svg"
        alt="The Nurture Moms"
        className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02] sm:h-10"
      />
    </Link>
  );
}
