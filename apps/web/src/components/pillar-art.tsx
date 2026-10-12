import type { PillarKey } from "@/lib/site-nav";

/**
 * Line art for the four pillars.
 *
 * Authored rather than sourced: the only illustrations in `public/images` are
 * supplement-and-bottle `category-*` art left from the maternal-nutrition
 * storefront this product used to be, and nothing there reads as yoga or as
 * community. They are drawn to one grid (120×120), one stroke weight (3,
 * round caps and joins) and one vocabulary, so the four cards read as a set
 * rather than four borrowed pictures.
 *
 * Strokes are `currentColor` and washes are `fill` on a separate layer, so a
 * card tints the whole drawing by setting a text colour and the art follows
 * the theme into dark mode without a second asset.
 */

type ArtProps = { className?: string };

function Frame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Move — a seated figure, grounded. */
function MoveArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      {/* Head */}
      <circle cx="60" cy="32" r="11" fill="currentColor" opacity={0.16} />
      <circle cx="60" cy="32" r="11" stroke="currentColor" strokeWidth={3} />
      {/* Torso */}
      <path d="M60 43v20" stroke="currentColor" strokeWidth={3} />
      {/* Arms out to the knees — the line that says "seated", not "standing" */}
      <path
        d="M60 52c-12 3-20 10-24 20M60 52c12 3 20 10 24 20"
        stroke="currentColor"
        strokeWidth={3}
      />
      {/* Crossed legs — wide and flat-bottomed so the silhouette reads as a
          grounded seat rather than a stem */}
      <path
        d="M24 90c8-15 19-22 36-22s28 7 36 22Z"
        fill="currentColor"
        opacity={0.16}
      />
      <path
        d="M24 90c8-15 19-22 36-22s28 7 36 22"
        stroke="currentColor"
        strokeWidth={3}
      />
      <path d="M22 90h76" stroke="currentColor" strokeWidth={3} />
    </Frame>
  );
}

/** Nourish — a bowl with something growing out of it. */
function NourishArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      {/* Sprout — stem and two leaves */}
      <path d="M60 60V30" stroke="currentColor" strokeWidth={3} />
      <path
        d="M60 42c-3-11-11-15-19-14-1 9 6 17 19 14Z"
        fill="currentColor"
        opacity={0.16}
      />
      <path
        d="M60 42c-3-11-11-15-19-14-1 9 6 17 19 14Z"
        stroke="currentColor"
        strokeWidth={3}
      />
      <path
        d="M60 34c3-10 10-14 17-13 1 8-5 15-17 13Z"
        fill="currentColor"
        opacity={0.16}
      />
      <path
        d="M60 34c3-10 10-14 17-13 1 8-5 15-17 13Z"
        stroke="currentColor"
        strokeWidth={3}
      />
      {/* Bowl */}
      <path d="M24 66h72c0 16-13 26-36 26S24 82 24 66Z" fill="currentColor" opacity={0.16} />
      <path
        d="M24 66h72c0 16-13 26-36 26S24 82 24 66Z"
        stroke="currentColor"
        strokeWidth={3}
      />
      <path d="M18 66h84" stroke="currentColor" strokeWidth={3} />
      {/* Spoon */}
      <path d="M96 98c6-6 8-13 6-20" stroke="currentColor" strokeWidth={3} opacity={0.45} />
    </Frame>
  );
}

/** Connect — two people, held together. */
function ConnectArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      {/* Heart between them */}
      <path
        d="M60 34c-5-7-15-5-15 3 0 6 8 11 15 16 7-5 15-10 15-16 0-8-10-10-15-3Z"
        fill="currentColor"
        opacity={0.2}
      />
      <path
        d="M60 34c-5-7-15-5-15 3 0 6 8 11 15 16 7-5 15-10 15-16 0-8-10-10-15-3Z"
        stroke="currentColor"
        strokeWidth={3}
      />
      {/* Left figure */}
      <circle cx="32" cy="62" r="10" stroke="currentColor" strokeWidth={3} />
      <path
        d="M12 98c0-12 9-20 20-20s20 8 20 20"
        stroke="currentColor"
        strokeWidth={3}
      />
      {/* Right figure */}
      <circle cx="88" cy="62" r="10" stroke="currentColor" strokeWidth={3} />
      <path
        d="M68 98c0-12 9-20 20-20s20 8 20 20"
        stroke="currentColor"
        strokeWidth={3}
      />
      {/* The overlap — what makes them a group and not two drawings */}
      <path d="M52 98c0-9 3.5-14 8-14s8 5 8 14" stroke="currentColor" strokeWidth={3} opacity={0.45} />
    </Frame>
  );
}

/** Pass it on — a pram, and the loop that sends it onward. */
function PassItOnArt({ className }: ArtProps) {
  return (
    <Frame className={className}>
      {/* The loop — drawn first so the pram sits on top of it */}
      <g stroke="currentColor" strokeWidth={3} opacity={0.4}>
        <path d="M100 42a44 44 0 0 0-84 6" />
        <path d="M16 34v14h14" />
      </g>
      {/* Hood */}
      <path d="M62 74V38c-18 0-32 15-32 36Z" fill="currentColor" opacity={0.16} />
      <path d="M62 74V38c-18 0-32 15-32 36Z" stroke="currentColor" strokeWidth={3} />
      {/* Body */}
      <path d="M26 74h64l-10 16H36Z" fill="currentColor" opacity={0.16} />
      <path d="M26 74h64l-10 16H36Z" stroke="currentColor" strokeWidth={3} />
      {/* Handle */}
      <path d="M88 74 100 54" stroke="currentColor" strokeWidth={3} />
      {/* Wheels */}
      <circle cx="42" cy="99" r="7" stroke="currentColor" strokeWidth={3} />
      <circle cx="76" cy="99" r="7" stroke="currentColor" strokeWidth={3} />
    </Frame>
  );
}

export const PILLAR_ART: Record<
  PillarKey,
  (props: ArtProps) => React.ReactElement
> = {
  move: MoveArt,
  nourish: NourishArt,
  connect: ConnectArt,
  "pass-it-on": PassItOnArt,
};
