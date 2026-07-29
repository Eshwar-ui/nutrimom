export const LISTING_IMAGE_FALLBACK = "/images/category-bg.png";

function isAllowedListingImage(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;

  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      /^[^.]+\.supabase\.co$/.test(url.hostname) &&
      url.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

/**
 * Returns image URLs that match the allowlist in next.config.ts. Bad listing
 * data falls back to a local image so it cannot crash a page using next/image.
 */
export function getListingImageSources(images: string[]) {
  const allowed = images.filter(isAllowedListingImage);
  return allowed.length > 0 ? allowed : [LISTING_IMAGE_FALLBACK];
}
