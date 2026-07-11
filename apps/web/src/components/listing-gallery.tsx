"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ListingGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-[2rem] border-2 border-border bg-muted">
        {main && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main} alt={alt} className="h-full w-full object-cover" />
        )}
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2.5">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "h-16 w-16 overflow-hidden rounded-xl border-2 transition-all",
                i === active ? "border-accent" : "border-border opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
