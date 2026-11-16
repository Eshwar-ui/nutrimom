/**
 * Admin-edited images (hero photo, founder photos, testimonial photos, the
 * community gallery) are uploaded to Supabase Storage, which next.config.ts
 * allows for next/image. But the admin forms accept any https URL, and
 * next/image throws on a host outside `images.remotePatterns` — one pasted
 * Instagram or Google Drive link would take the whole page down.
 *
 * So: images on an allowed host go through the optimiser, anything else is
 * served as-is (`unoptimized`), which bypasses the loader and its host check.
 * Same allowlist as next.config.ts — keep the two in step.
 */
export function isOptimizableImage(src: string): boolean {
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
