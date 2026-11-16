import Link from "next/link";
import {
  FAQ_SECTION_LABELS,
  FaqSection,
  MEMBERSHIP_PLANS,
  MEMBERSHIP_PLAN_ORDER,
  REGISTRATION_FEE_PAISE,
  formatBps,
  formatPaise,
} from "@nutrimom/shared";
import { Container } from "@/components/ui/primitives";
import { JsonLd } from "@/components/json-ld";
import { MarkdownContent } from "@/components/markdown-content";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
import { getFaqs } from "@/lib/content";
import { markdownExcerpt } from "@/lib/blog";
import {
  getCancellationPolicy,
  getCommissionBps,
  hoursText,
  refundShareText,
} from "@/lib/marketplace-policy";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "How booking, payments, delivery, refunds and selling work at The Nurture Moms — yoga and nutrition sessions, the mom community, and preloved buying and selling.",
  path: "/faq",
});

interface Qa {
  q: string;
  a: React.ReactNode;
  /** Plain-text answer for the FAQPage structured data, which takes no JSX. */
  text: string;
  sortOrder: number;
}

/** Questions compared ignoring case and punctuation. */
const sameQuestion = (a: string, b: string) => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return norm(a) === norm(b);
};

/**
 * The questions and answers are the admin's (`/admin/faqs`), grouped by the
 * section labels in shared and in the admin's sort order.
 *
 * Two answers stay in code because they quote live figures — the cancellation
 * window and refund share from the CancellationPolicy that
 * OrdersService.cancel enforces, and the seller fees from the constants the
 * billing gate charges. An FAQ that restates a number will eventually
 * contradict the rule it explains, and this is the page a buyer quotes back at
 * you. They slot into "Buying & selling preloved" by sortOrder; if the admin
 * adds a row with the same question, the live-figure version wins.
 */
export default async function FaqPage() {
  const [faqs, policy, commissionBps] = await Promise.all([
    getFaqs(),
    getCancellationPolicy(),
    getCommissionBps(),
  ]);

  const cutoff = policy
    ? `within ${hoursText(policy.cutoffHours)} of placing it`
    : "within the time shown when you order";
  const refund = refundShareText(policy);
  const plans = MEMBERSHIP_PLAN_ORDER.map(
    (key) => `${MEMBERSHIP_PLANS[key].label} ${formatPaise(MEMBERSHIP_PLANS[key].priceInPaise)}`,
  ).join(", ");
  const commission =
    commissionBps !== null ? `a ${formatBps(commissionBps)} commission` : "a commission";

  const liveAnswers: (Qa & { section: FaqSection })[] = [
    {
      section: FaqSection.MARKETPLACE,
      sortOrder: 25,
      q: "Can I cancel an order?",
      a: (
        <>
          Yes. You can cancel from{" "}
          <Link href="/account/orders" className="font-semibold text-accent-text hover:underline">
            My orders
          </Link>{" "}
          {cutoff}, as long as the seller hasn&apos;t printed the address label
          yet, and you&apos;ll get {refund} to your original payment method.
          After that the seller may already be packing it, so please contact
          us instead.{" "}
          <Link href="/refunds" className="font-semibold text-accent-text hover:underline">
            Full refund policy
          </Link>
          .
        </>
      ),
      text: `Yes. You can cancel from My orders ${cutoff}, as long as the seller hasn't printed the address label yet, and you'll get ${refund} to your original payment method. After that the seller may already be packing it, so please contact us instead.`,
    },
    {
      section: FaqSection.MARKETPLACE,
      sortOrder: 27,
      q: "What does it cost to sell?",
      a: (
        <>
          A one-time {formatPaise(REGISTRATION_FEE_PAISE)} registration fee to
          set up your seller account, then a membership plan: {plans}.
          Registration comes first, you need an active plan to list an item,
          and we keep {commission} on each sale.{" "}
          <Link href="/preloved#selling" className="font-semibold text-accent-text hover:underline">
            How selling works
          </Link>
          .
        </>
      ),
      text: `A one-time ${formatPaise(REGISTRATION_FEE_PAISE)} registration fee to set up your seller account, then a membership plan: ${plans}. Registration comes first, you need an active plan to list an item, and we keep ${commission} on each sale.`,
    },
  ];

  const sections = (Object.keys(FAQ_SECTION_LABELS) as FaqSection[])
    .map((section) => {
      const live = liveAnswers.filter((l) => l.section === section);
      const fromAdmin: Qa[] = faqs
        .filter((f) => f.section === section)
        .filter((f) => !live.some((l) => sameQuestion(l.q, f.question)))
        .map((f) => ({
          q: f.question,
          a: (
            <MarkdownContent
              markdown={f.answer}
              headingOffset={3}
              className="text-muted-foreground [&_p:first-child]:mt-0"
            />
          ),
          text: markdownExcerpt(f.answer, ""),
          sortOrder: f.sortOrder,
        }));
      const items = [...fromAdmin, ...live].sort((a, b) => a.sortOrder - b.sortOrder);
      return { key: section, title: FAQ_SECTION_LABELS[section], items };
    })
    // A heading over nothing is a placeholder by another name.
    .filter((section) => section.items.length > 0);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl("/faq")}#faq`,
    mainEntity: sections.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.text },
      })),
    ),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <Container className="max-w-3xl py-12 sm:py-16">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Sessions, the community, and buying, selling or donating preloved —
          the things mothers ask us most.
        </p>

        {sections.length > 1 && (
          <nav aria-label="FAQ sections" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <li key={section.key}>
                  <a
                    href={`#faq-${section.key.toLowerCase()}`}
                    className="inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/45 hover:bg-muted"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {sections.map((section) => (
          <section
            key={section.key}
            id={`faq-${section.key.toLowerCase()}`}
            aria-labelledby={`faq-${section.key.toLowerCase()}-heading`}
            className="mt-section scroll-mt-28"
          >
            <h2
              id={`faq-${section.key.toLowerCase()}-heading`}
              className="font-display text-2xl font-semibold text-foreground"
            >
              {section.title}
            </h2>
            <dl className="mt-5 space-y-4">
              {section.items.map((item) => (
                <div
                  key={item.q}
                  className="rounded-card border-2 border-border bg-surface p-6 card-shadow"
                >
                  <dt className="font-display text-lg font-semibold text-foreground">
                    {item.q}
                  </dt>
                  <dd className="mt-2 leading-relaxed text-muted-foreground">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section className="mt-section rounded-card border-2 border-border bg-surface-2 p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Still have a question?
          </h2>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted-foreground">
            Ask us directly — we would rather answer a question twice than have
            you guess.
          </p>
          <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
            Contact Us
          </Link>
        </section>
      </Container>
    </>
  );
}
