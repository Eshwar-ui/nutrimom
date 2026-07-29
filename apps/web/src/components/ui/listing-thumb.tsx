"use client";

import { useState } from "react";
import { LISTING_IMAGE_FALLBACK } from "@/lib/listing-image";
import { cn } from "@/lib/utils";

/**
 * Thumbnail for a listing image that can't be trusted to load. Order and cart
 * rows keep a snapshot of the image URL taken when the item was added, so it
 * can outlive the file it points at — and a dead URL would otherwise render as
 * broken-image chrome with the alt text spilling out of the frame.
 *
 * Plain <img> rather than next/image on purpose: these URLs are historical and
 * may not match the remote allowlist in next.config.ts, which would throw.
 */
export function ListingThumb({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? LISTING_IMAGE_FALLBACK : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      // Re-firing on the fallback itself is harmless: the state is already
      // true, so it doesn't re-render and can't loop.
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
