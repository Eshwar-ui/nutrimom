import Image from "next/image";
import { Quote } from "lucide-react";
import type { Testimonial } from "@nutrimom/shared";
import { Container } from "./ui/primitives";
import { Reveal } from "./reveal";
import { isOptimizableImage } from "@/lib/content-image";
import { cn } from "@/lib/utils";

/**
 * Mothers' own words, from the admin's Testimonials list. The API only returns
 * rows that are published *and* have the mother's written permission
 * recorded, and this renders nothing when there are none — the brief forbids
 * invented testimonials, and an empty "What moms say" heading is a placeholder
 * by another name (REDESIGN-PLAN decision 5).
 */
export function TestimonialsSection({
  testimonials,
  eyebrow = "In their words",
  heading = "What mothers tell us",
  className,
}: {
  testimonials: readonly Testimonial[];
  eyebrow?: string;
  heading?: string;
  className?: string;
}) {
  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-heading" className={cn("py-band", className)}>
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent-text">{eyebrow}</p>
          <h2
            id="testimonials-heading"
            className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl"
          >
            {heading}
          </h2>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <li key={t.id} className="list-none">
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <figure className="flex h-full flex-col rounded-card border-2 border-border bg-surface p-6 card-shadow sm:p-7">
                  <Quote className="h-6 w-6 text-accent-text" aria-hidden strokeWidth={1.8} />
                  <blockquote className="mt-3 flex-1 whitespace-pre-line font-display text-lg leading-relaxed text-foreground">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    {t.photoUrl ? (
                      <Image
                        src={t.photoUrl}
                        alt={`Photo of ${t.name}`}
                        width={88}
                        height={88}
                        unoptimized={!isOptimizableImage(t.photoUrl)}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage/45 font-display text-base font-semibold text-sage-ink"
                      >
                        {t.name.charAt(0)}
                      </span>
                    )}
                    <span className="text-sm">
                      <span className="block font-bold text-foreground">{t.name}</span>
                      {t.context && (
                        <span className="block text-muted-foreground">{t.context}</span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
