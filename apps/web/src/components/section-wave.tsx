import { cn } from "@/lib/utils";

/**
 * Decorative divider between two sections.
 *
 * Each shape is a solid fill with a wavy BOTTOM edge, so the coloured part is
 * the top region. Drop it at the top of the lower section and colour it with
 * the UPPER section's colour — the fill bleeds down and the wavy edge reveals
 * the section below. Use `flip` for the reverse direction.
 *
 * Colour comes from `currentColor`, so set it with any text-* token utility:
 *
 *   // cream "How it works" section flowing into the green CTA band
 *   <section className="relative bg-primary">
 *     <SectionWave variant="playful" className="text-background" />
 *     ...
 *   </section>
 */

export type WaveVariant = "calm" | "playful" | "scallop" | "hill";

const PATHS: Record<WaveVariant, string> = {
  // one gentle, slightly off-centre swell
  calm: "M0,0 H1440 V56 C1150,104 880,8 620,44 C400,74 160,104 0,72 Z",
  // two soft blobby humps — echoes the banner artwork
  playful:
    "M0,0 H1440 V50 C1300,86 1180,40 1040,64 C880,92 720,40 560,64 C420,86 160,44 0,60 Z",
  // row of rounded scallops — cute, baby-ish
  scallop:
    "M0,0 H1440 V60 Q1350,110 1260,60 Q1170,110 1080,60 Q990,110 900,60 Q810,110 720,60 Q630,110 540,60 Q450,110 360,60 Q270,110 180,60 Q90,110 0,60 Z",
  // one big asymmetric hill
  hill: "M0,0 H1440 V64 C1120,120 900,110 620,72 C420,44 180,60 0,90 Z",
};

export function SectionWave({
  variant = "calm",
  flip = false,
  className,
}: {
  variant?: WaveVariant;
  /** Mirror vertically — wavy edge points up instead of down. */
  flip?: boolean;
  /** Set the fill via a text-* token (e.g. `text-background`) plus any height. */
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none block h-14 w-full leading-[0] sm:h-20",
        className,
      )}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={cn("block h-full w-full", flip && "-scale-y-100")}
      >
        <path d={PATHS[variant]} fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * The custom wave asset (public/wave.svg), recoloured to the page background and
 * lifted with a soft upward shadow. Drop it inside the `relative` hero section:
 * it sits flush on the bottom edge and turns the image's hard base into a wavy,
 * shadowed transition into the section below.
 */
export function HeroWave({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 leading-[0]",
        className,
      )}
      style={{ filter: "drop-shadow(0 -5px 6px rgb(36 28 24 / 0.15))" }}
    >
      <svg
        viewBox="0 0 1440 105"
        preserveAspectRatio="none"
        className="block h-[clamp(44px,6vw,92px)] w-full"
      >
        <path
          d="M0 41C60 12 180 12 240 41C300 70 420 70 480 41C540 12 660 12 720 41C780 70 900 70 960 41C1020 12 1140 12 1200 41C1260 70 1380 70 1440 41V105H0Z"
          fill="var(--background)"
        />
      </svg>
    </div>
  );
}

/** Pastel palette tokens available for {@link PastelWave}. */
export type PastelToken = "blush" | "lavender" | "sky" | "sage" | "beige";

// Stacked layers, ordered top band → bottom band. Each fills from the top down
// to a wavy edge; lower layers reach further down, so once the upper layers are
// painted over them each colour shows as its own band — the way the banner's
// overlapping blobs do. Painted deepest-first so the top layer ends up on top.
const LAYER_PATHS = [
  "M0,0 H1440 V58 C1150,104 880,26 620,54 C400,76 160,104 0,76 Z",
  "M0,0 H1440 V86 C1240,132 1010,54 780,86 C560,112 250,132 0,100 Z",
  "M0,0 H1440 V112 C1210,150 980,96 720,118 C500,138 240,150 0,124 Z",
];

/**
 * Layered pastel divider — soft overlapping waves in the brand's pastel tones,
 * echoing the hero banner. Colours are theme tokens, listed back-to-front.
 *
 *   <section className="relative bg-background">
 *     <PastelWave colors={["lavender", "blush"]} />
 *     ...
 *   </section>
 */
export function PastelWave({
  colors = ["lavender", "blush"],
  flip = false,
  className,
}: {
  /** 1–3 pastel tokens, drawn back (first) to front (last). */
  colors?: PastelToken[];
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none block h-16 w-full leading-[0] sm:h-24",
        className,
      )}
    >
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className={cn("block h-full w-full", flip && "-scale-y-100")}
      >
        {colors.slice(0, 3).map((_, i, arr) => {
          // Paint deepest band first so upper bands layer cleanly on top.
          const idx = arr.length - 1 - i;
          return (
            <path
              key={idx}
              d={LAYER_PATHS[idx]}
              fill={`var(--${arr[idx]})`}
            />
          );
        })}
      </svg>
    </div>
  );
}
