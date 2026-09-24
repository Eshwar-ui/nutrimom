import type { PillarKey } from "./site-nav";

/**
 * The free downloadable guides, served as static files from
 * `public/resources/`.
 *
 * One list feeds the /resources library and the "free guide" callouts on the
 * pillar pages, so a guide added or retired here appears or disappears
 * everywhere at once. The PDFs are replaced in place under the same filename —
 * a renamed file breaks every link anyone has already shared on WhatsApp.
 */
export interface FreeResource {
  slug: string;
  title: string;
  /** Who it is for, in the visitor's words — shown as the card eyebrow. */
  stage: string;
  pillar: PillarKey;
  description: string;
  /** A few of the guide's actual section headings, so the card is specific. */
  highlights: readonly string[];
  pages: number;
  file: string;
}

export const FREE_RESOURCES: readonly FreeResource[] = [
  {
    slug: "pregnancy-wellness-guide",
    title: "Pregnancy Wellness Starter Guide",
    stage: "I'm pregnant",
    pillar: "nourish",
    description:
      "Simple, practical guidance for Indian moms — from the first positive test to preparing for birth.",
    highlights: [
      "Trimester-by-trimester foundations",
      "Nutrients to pay attention to",
      "A simple 7-day pregnancy food framework",
    ],
    pages: 11,
    file: "/resources/pregnancy-wellness-guide.pdf",
  },
  {
    slug: "prenatal-yoga-starter-guide",
    title: "Prenatal Yoga Starter Guide",
    stage: "Moving through pregnancy",
    pillar: "move",
    description:
      "Gentle, beginner-friendly movement for pregnancy — comfort and mobility, not maximum flexibility.",
    highlights: [
      "A 5-minute pregnancy reset",
      "A simple 15-minute prenatal flow",
      "What to avoid, and when to stop",
    ],
    pages: 11,
    file: "/resources/prenatal-yoga-starter-guide.pdf",
  },
  {
    slug: "postpartum-nourishment-guide",
    title: "Postpartum Nourishment Guide",
    stage: "I'm postpartum",
    pillar: "nourish",
    description:
      "Practical food ideas for recovery, energy and everyday motherhood — because moms deserve nourishment too.",
    highlights: [
      "Your postpartum plate",
      "Breastfeeding & nourishment",
      "A simple 7-day meal framework",
    ],
    pages: 11,
    file: "/resources/postpartum-nourishment-guide.pdf",
  },
  {
    slug: "baby-toddler-meal-ideas",
    title: "20 Easy Baby & Toddler Meal Ideas",
    stage: "Starting solids & toddlers",
    pillar: "nourish",
    description:
      "Simple Indian-style ideas for busy moms — from first textures to family-friendly toddler meals.",
    highlights: [
      "20 meals, marked by age from 6 months",
      "A quick safety guide before you start",
      "Build a balanced toddler plate",
    ],
    pages: 8,
    file: "/resources/baby-toddler-meal-ideas.pdf",
  },
] as const;

export function getResources(slugs: readonly string[]): FreeResource[] {
  return slugs
    .map((slug) => FREE_RESOURCES.find((r) => r.slug === slug))
    .filter((r): r is FreeResource => r !== undefined);
}
