import { Container, Card } from "@/components/ui/primitives";
import { FullLogo, LogoEmblem } from "@/components/logo";

export const metadata = { title: "Brand / Logo" };

// Framings of the real /logo.svg — pick a crop + badge and I'll set it live.
const crops = [
  { scale: 1.6, origin: "50% 32%", label: "Loose · 1.6×" },
  { scale: 1.82, origin: "50% 30%", label: "Balanced · 1.82×" },
  { scale: 2.1, origin: "50% 28%", label: "Tight · 2.1×" },
];

const badges = [
  { label: "White", cls: "bg-surface ring-accent/30" },
  { label: "Cream", cls: "bg-cream ring-accent/30" },
  { label: "Blush", cls: "bg-blush ring-white/60" },
  { label: "Sage", cls: "bg-sage ring-white/60" },
  { label: "Coral", cls: "bg-accent ring-white/60" },
];

export default function BrandPage() {
  return (
    <Container className="max-w-4xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">
        Brand logo
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        One brand artwork, framed for different places. Tell me the emblem crop
        and badge you like (e.g. &ldquo;balanced on cream&rdquo;) and I&apos;ll
        set the nav, footer, and favicon to match.
      </p>

      {/* Full logo */}
      <h2 className="mt-10 font-display text-xl font-semibold text-foreground">
        Full logo — for the footer &amp; roomy surfaces
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-center p-8">
          <FullLogo className="max-w-[220px]" />
        </Card>
        <Card className="flex items-center justify-center bg-primary p-8">
          <FullLogo className="max-w-[180px]" />
        </Card>
      </div>

      {/* Emblem crops */}
      <h2 className="mt-12 font-display text-xl font-semibold text-foreground">
        Emblem crop — for the nav &amp; avatars
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The heart-circle with the wordmark cropped out, so it reads at 40px.
      </p>
      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-end gap-10">
          {crops.map((c) => (
            <div key={c.label} className="flex flex-col items-center gap-3">
              <div className="flex items-end gap-3">
                <LogoEmblem scale={c.scale} origin={c.origin} />
                <LogoEmblem
                  scale={c.scale}
                  origin={c.origin}
                  badgeClassName="h-16 w-16"
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Emblem on badge colours */}
      <h2 className="mt-12 font-display text-xl font-semibold text-foreground">
        Emblem badge colours
      </h2>
      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-end gap-8">
          {badges.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2">
              <LogoEmblem badgeClassName={b.cls} />
              <span className="text-[11px] text-muted-foreground">
                {b.label}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <LogoEmblem className="grayscale" />
            <span className="text-[11px] text-muted-foreground">Monochrome</span>
          </div>
        </div>
      </Card>
    </Container>
  );
}
