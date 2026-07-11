import Link from "next/link";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { LegalPlaceholderBanner } from "@/components/legal-placeholder-banner";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** The four policy/legal pages, used for the cross-page "related" rail. */
export const legalPages = [
  { href: "/policies", label: "Community policies" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refunds & Cancellation" },
];

/**
 * Shared shell for long-form legal pages (terms, privacy, refunds): eyebrow +
 * title, cross-page rail, the placeholder banner, a sticky table of contents,
 * and numbered sections with anchor targets. Pure anchor nav — no client JS.
 */
export function LegalDoc({
  title,
  lastUpdated,
  currentHref,
  intro,
  sections,
}: {
  title: string;
  lastUpdated: string;
  currentHref: string;
  intro?: string;
  sections: LegalSection[];
}) {
  const related = legalPages.filter((p) => p.href !== currentHref);

  return (
    <Container className="py-12 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-3 leading-relaxed text-muted-foreground">{intro}</p>}
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </header>

      <div className="mt-8">
        <LegalPlaceholderBanner />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        {/* Document */}
        <article className="min-w-0 max-w-[68ch] space-y-9">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-foreground">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                {s.title}
              </h2>
              <div className="mt-2.5 pl-10 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-accent-text [&_a:hover]:underline">
                {s.body}
              </div>
            </section>
          ))}

          {/* Questions callout */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-2/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageCircleQuestion className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <div>
                <p className="font-semibold text-foreground">Still have a question?</p>
                <p className="text-sm text-muted-foreground">We&apos;re happy to walk you through anything here.</p>
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
            >
              Contact us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        {/* Sticky table of contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <nav aria-label="On this page">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent-text">On this page</p>
              <ul className="space-y-0.5 border-l border-border">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      <span className="tabular-nums text-muted-foreground/60">{i + 1}.</span>
                      <span>{s.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Related</p>
              <ul className="space-y-1.5">
                {related.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
