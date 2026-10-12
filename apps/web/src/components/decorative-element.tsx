/** Floating hand-drawn doodle accent, positioned via `className`. Purely
 *  decorative — hidden from assistive tech. Shared across the playful pages. */
export function DecorativeElement({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden="true"
      src={src}
      alt=""
      className={`pointer-events-none absolute z-0 select-none ${className}`}
    />
  );
}
