import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Faq } from "@nutrimom/shared";
import { MarkdownContent } from "./markdown-content";

/**
 * The admin-edited FAQs for one service, under its price grid
 * (REDESIGN-PLAN Phase 3, "Sessions & booking"). Native <details>, so it is
 * keyboard- and screen-reader-operable with no client JS, and the page stays a
 * server component.
 *
 * Deliberately no FAQPage JSON-LD here: /faq carries it, and the same
 * questions marked up on two URLs compete with each other.
 *
 * Hidden when there is nothing published — a heading over an empty list is a
 * placeholder by another name (decision 5).
 */
export function ServiceFaqs({
  heading,
  faqs,
}: {
  heading: string;
  faqs: readonly Faq[];
}) {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="service-faqs-heading" className="mt-section">
      <h2
        id="service-faqs-heading"
        className="font-display text-2xl font-semibold text-foreground sm:text-3xl"
      >
        {heading}
      </h2>
      <div className="mt-6 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface card-shadow">
        {faqs.map((faq) => (
          <details key={faq.id} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 font-semibold text-foreground transition-colors hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <MarkdownContent
              markdown={faq.answer}
              headingOffset={3}
              className="px-6 pb-5 text-sm text-muted-foreground [&_p:first-child]:mt-0"
            />
          </details>
        ))}
      </div>
      <Link
        href="/faq"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent-text hover:underline"
      >
        See all FAQs <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
