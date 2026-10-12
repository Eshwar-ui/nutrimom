import Link from "next/link";
import { ArrowRight, Check, Download, FileText } from "lucide-react";
import { TrackedExternalLink } from "./tracked-link";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { getResources, type FreeResource } from "@/lib/resources";

/**
 * Cards for the free PDF guides in `lib/resources.ts`.
 *
 * Downloads go through a plain anchor rather than next/link: the file is a
 * static asset, not a route, and next/link would try to prefetch it.
 */

const PAPERS = [
  { paper: "bg-blush/45", tint: "bg-blush", ink: "text-[#7a2447]" },
  { paper: "bg-sky/50", tint: "bg-sky", ink: "text-[#215172]" },
  { paper: "bg-sage/45", tint: "bg-sage", ink: "text-[#2f5236]" },
  { paper: "bg-lavender/45", tint: "bg-lavender", ink: "text-[#4a3170]" },
] as const;

function DownloadLink({
  resource,
  source,
  className,
}: {
  resource: FreeResource;
  /** Which page the download came from, so the funnel can be read per entry point. */
  source: string;
  className?: string;
}) {
  return (
    <TrackedExternalLink
      event="resource_download"
      eventProps={{ resource: resource.slug, source }}
      href={resource.file}
      download
      className={className}
    >
      <Download className="h-4 w-4" /> Download free PDF
    </TrackedExternalLink>
  );
}

export function ResourceCard({
  resource,
  index,
  source,
}: {
  resource: FreeResource;
  index: number;
  source: string;
}) {
  const stock = PAPERS[index % PAPERS.length];

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-[1.75rem] border-2 border-border p-7 card-shadow",
        stock.paper,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -right-3 -top-3 grid h-12 w-12 rotate-6 place-items-center rounded-full border-2 border-surface",
          stock.tint,
          stock.ink,
        )}
      >
        <FileText className="h-5 w-5" strokeWidth={1.8} />
      </span>

      <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-text">
        {resource.stage}
      </p>
      <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground">
        {resource.title}
      </h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {resource.description}
      </p>

      <ul className="mt-5 space-y-2">
        {resource.highlights.map((h) => (
          <li key={h} className="flex gap-2.5 text-sm leading-snug text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" strokeWidth={2.2} />
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-7">
        <span className="text-xs font-semibold text-muted-foreground">
          PDF · {resource.pages} pages
        </span>
        <DownloadLink
          resource={resource}
          source={source}
          className={cn(buttonVariants({ size: "md" }), "gap-2")}
        />
      </div>
    </article>
  );
}

/**
 * A compact "free guide" band for a pillar page, pointing at the guides that
 * page's visitor is most likely to want, with a link to the full library.
 */
export function FreeGuideCallout({
  slugs,
  source,
}: {
  slugs: readonly string[];
  source: string;
}) {
  const resources = getResources(slugs);
  if (resources.length === 0) return null;

  return (
    <section className="mt-14 rounded-[1.75rem] border-2 border-border bg-surface p-6 card-shadow sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">
            Free to download
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
            {resources.length === 1 ? "A free guide to start with" : "Free guides to start with"}
          </h2>
        </div>
        <Link
          href="/resources"
          className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-primary hover:underline"
        >
          All free guides <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {resources.map((r, i) => {
          const stock = PAPERS[i % PAPERS.length];
          return (
            <li
              key={r.slug}
              className={cn("flex flex-col rounded-2xl border border-border p-5", stock.paper)}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent-text">
                {r.stage}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-foreground">
                {r.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {r.description}
              </p>
              <DownloadLink
                resource={r}
                source={source}
                className="mt-2 inline-flex items-center gap-2 self-start py-2 text-sm font-semibold text-primary hover:underline"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
