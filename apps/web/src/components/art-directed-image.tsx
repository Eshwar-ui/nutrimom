import { getImageProps } from "next/image";

export interface ArtSource {
  src: string;
  /** Intrinsic size of the file — sets the aspect ratio before it loads. */
  width: number;
  height: number;
}

/**
 * A full-width hero with a different crop per breakpoint (art direction),
 * routed through the Next image optimizer via `getImageProps` — the documented
 * pattern for `<picture>` in this Next version.
 *
 * Why not a bare `<picture>` with the files in `srcSet`: that serves one fixed
 * file to every screen (these were 1.5–2 MB PNGs) and, with no width/height,
 * the hero collapsed to zero height until it arrived and then shoved the page
 * down. Here every `<source>` carries a resized `srcSet` and its own
 * width/height, so each breakpoint reserves the right box up front.
 *
 * `eager` is for the page's LCP image (every current use is the first thing
 * on the page). It sets `fetchPriority="high"` rather than `preload`: a
 * preload link can only name one candidate, and which crop is the LCP depends
 * on the viewport.
 */
export function ArtDirectedImage({
  alt,
  desktop,
  tablet,
  mobile,
  eager = false,
  className,
}: {
  alt: string;
  /** Used from 1024px. */
  desktop: ArtSource;
  /** Used from 768px. */
  tablet: ArtSource;
  /** The default, and the `<img>` fallback. */
  mobile: ArtSource;
  eager?: boolean;
  className?: string;
}) {
  const common = { alt, sizes: "100vw" } as const;
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({ ...common, ...desktop });
  const {
    props: { srcSet: tabletSet },
  } = getImageProps({ ...common, ...tablet });
  const {
    props: { srcSet: mobileSet, ...rest },
  } = getImageProps({
    ...common,
    ...mobile,
    ...(eager ? { loading: "eager" as const, fetchPriority: "high" as const } : {}),
  });

  return (
    <picture>
      <source
        media="(min-width: 1024px)"
        srcSet={desktopSet}
        sizes="100vw"
        width={desktop.width}
        height={desktop.height}
      />
      <source
        media="(min-width: 768px)"
        srcSet={tabletSet}
        sizes="100vw"
        width={tablet.width}
        height={tablet.height}
      />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in `rest` */}
      <img {...rest} srcSet={mobileSet} className={className} />
    </picture>
  );
}
