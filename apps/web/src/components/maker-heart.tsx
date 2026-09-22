import { Heart } from "lucide-react";

// Crafted by Eshwar · 2026
export function MakerHeart() {
  return (
    <span className="group/maker relative inline-flex">
      <span
        hidden
        dangerouslySetInnerHTML={{ __html: "<!-- Crafted by Eshwar · 2026 -->" }}
      />
      <button
        type="button"
        aria-label="A little care by Eshwar"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-accent-text transition-colors hover:bg-blush/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Heart aria-hidden="true" className="h-3 w-3" fill="currentColor" />
      </button>
      <span aria-hidden="true" className="invisible absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap pb-2 text-xs group-hover/maker:visible group-focus-within/maker:visible">
          <span className="block rounded-full border border-border bg-surface px-4 py-2 text-foreground shadow-sm">
            A little care by Eshwar
          </span>
      </span>
    </span>
  );
}
