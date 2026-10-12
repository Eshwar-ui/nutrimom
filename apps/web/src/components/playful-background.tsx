import { cn } from "@/lib/utils";
import { DecorativeElement } from "@/components/decorative-element";

type PlayfulBackgroundVariant = "market" | "fresh" | "trust" | "cta";
type OptionalElementClass = Record<PlayfulBackgroundVariant, string | null>;

const backgroundElements: Record<
  PlayfulBackgroundVariant,
  Array<{ src: string; className: string }>
> = {
  market: [
    {
      src: "/images/bg-element-price-tag.png",
      className: "-right-10 top-10 hidden w-32 rotate-6 opacity-55 lg:block",
    },
    {
      src: "/images/bg-element-star-cluster.png",
      className: "left-[3%] bottom-4 hidden w-32 -rotate-6 opacity-45 xl:block",
    },
    {
      src: "/images/bg-element-baby-rattle.png",
      className: "right-[13%] bottom-6 hidden w-24 -rotate-12 opacity-35 lg:block",
    },
  ],
  fresh: [
    {
      src: "/images/bg-element-delivery-parcel.png",
      className: "-left-16 bottom-2 hidden w-40 -rotate-6 opacity-25 xl:block",
    },
    {
      src: "/images/bg-element-baby-bib.png",
      className: "-right-8 top-4 hidden w-28 rotate-6 opacity-20 lg:block",
    },
    {
      src: "/images/bg-element-star-cluster.png",
      className: "right-[22%] bottom-3 hidden w-24 rotate-12 opacity-30 xl:block",
    },
  ],
  trust: [
    {
      src: "/images/bg-element-baby-rattle.png",
      className: "right-[7%] -top-8 hidden w-32 rotate-12 opacity-25 lg:block",
    },
    {
      src: "/images/bg-element-price-tag.png",
      className: "left-[3%] bottom-8 hidden w-28 -rotate-12 opacity-25 xl:block",
    },
  ],
  cta: [
    {
      src: "/images/bg-element-delivery-parcel.png",
      className: "left-[6%] bottom-0 hidden w-40 -rotate-6 opacity-20 lg:block",
    },
    {
      src: "/images/bg-element-star-cluster.png",
      className: "right-[18%] top-5 hidden w-28 rotate-6 opacity-25 md:block",
    },
    {
      src: "/images/bg-element-baby-bib.png",
      className: "right-4 bottom-2 hidden w-28 rotate-12 opacity-20 xl:block",
    },
  ],
};

export function PlayfulBackground({
  variant = "market",
  className,
}: {
  variant?: PlayfulBackgroundVariant;
  className?: string;
}) {
  const trail = trailClass[variant];
  const toggle = toggleClass[variant];
  const confetti = confettiClass[variant];

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
    >
      {backgroundElements[variant].map((element) => (
        <DecorativeElement
          key={`${variant}-${element.src}`}
          src={element.src}
          className={element.className}
        />
      ))}
      {trail && <DoodleTrail className={trail} />}
      {toggle && <FloatingToggle className={toggle} />}
      {confetti && <ConfettiField className={confetti} />}
    </div>
  );
}

const trailClass: OptionalElementClass = {
  market: "left-[7%] top-24 hidden w-52 -rotate-6 opacity-45 md:block",
  fresh: null,
  trust: "left-[5%] bottom-8 hidden w-56 rotate-6 opacity-30 md:block",
  cta: "right-[5%] top-8 hidden w-44 -rotate-3 opacity-20 xl:block",
};

const toggleClass: OptionalElementClass = {
  market: "right-[14%] top-28 hidden rotate-6 md:block",
  fresh: "left-[9%] top-10 hidden -rotate-3 lg:block",
  trust: "right-[14%] bottom-10 hidden rotate-2 xl:block",
  cta: null,
};

const confettiClass: OptionalElementClass = {
  market: "left-[8%] bottom-16 hidden md:block",
  fresh: "left-[23%] top-7 hidden lg:block",
  trust: "left-[14%] top-20 hidden lg:block",
  cta: "left-[46%] top-8 hidden md:block",
};

function DoodleTrail({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 120"
      fill="none"
      className={cn("absolute", className)}
    >
      <path
        d="M7 78C39 29 74 113 107 62C129 29 148 8 176 34C198 55 200 88 214 75"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="2 13"
      />
      <path
        d="M51 32l8 9 11-17"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="185" cy="88" r="8" fill="var(--gold)" opacity="0.75" />
    </svg>
  );
}

function FloatingToggle({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute grid h-10 w-20 grid-cols-2 rounded-full border-2 border-border bg-surface/80 p-1 shadow-[0_12px_28px_-18px_rgba(36,28,24,0.5)] backdrop-blur-sm",
        className,
      )}
    >
      <span className="rounded-full bg-sage/70" />
      <span className="rounded-full border border-border bg-background" />
    </span>
  );
}

function ConfettiField({ className }: { className?: string }) {
  return (
    <span className={cn("absolute h-24 w-28", className)}>
      <span className="absolute left-3 top-5 h-3 w-3 rounded-full bg-gold/80" />
      <span className="absolute left-12 top-1 h-2 w-8 rotate-12 rounded-full bg-accent/55" />
      <span className="absolute right-3 top-10 h-4 w-4 rotate-12 rounded-[4px] bg-sky/80" />
      <span className="absolute bottom-3 left-8 h-2 w-10 -rotate-12 rounded-full bg-primary/35" />
      <span className="absolute bottom-8 right-9 h-3 w-3 rounded-full bg-blush/90" />
    </span>
  );
}
