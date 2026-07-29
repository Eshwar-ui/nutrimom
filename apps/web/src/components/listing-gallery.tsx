"use client";

import { useState } from "react";
import Image from "next/image";
import { getListingImageSources } from "@/lib/listing-image";
import { cn } from "@/lib/utils";

export function ListingGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const safeImages = getListingImageSources(images);
  const main = safeImages[active] ?? safeImages[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border-2 border-border bg-muted">
        <Image
          src={main}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
      {safeImages.length > 1 && (
        <div className="flex flex-wrap gap-2.5">
          {safeImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all",
                i === active ? "border-accent" : "border-border opacity-70 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
