import Link from "next/link";
import {
  MEMBERSHIP_PLANS,
  REGISTRATION_FEE_PAISE,
  formatPaise,
  type CancellationPolicy,
} from "@nutrimom/shared";
import { request } from "@/lib/api";
import { Container } from "@/components/ui/primitives";
import { JsonLd } from "@/components/json-ld";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Frequently asked questions",
  description:
    "How booking, payments, shipping, refunds and selling work at The Nurture Moms — answers on yoga and nutrition sessions, the mom community, and buying or selling preloved baby gear.",
  path: "/faq",
});

/**
 * Every figure on this page is read from the same source the rest of the site
 * enforces — the live cancellation policy, and the membership constants in
 * shared. An FAQ that restates a number is an FAQ that will eventually
 * contradict the page it is explaining, and this is the page a buyer quotes
 * back at you.
 */
async function getCancellationPolicy(): Promise<CancellationPolicy | null> {
  try {
    return await request<CancellationPolicy>("/cancellation-policy", {
      revalidate: 300,
    });
  } catch {
    return null;
  }
}

interface Qa {
  q: string;
  a: React.ReactNode;
  /** Plain-text answer for the FAQPage structured data, which takes no JSX. */
  text: string;
}

export default async function FaqPage() {
  const policy = await getCancellationPolicy();
  const cutoff = policy
    ? `${policy.cutoffHours} hours`
    : "the window shown at checkout";
  const refundShare = policy ? `${policy.refundPercentage}%` : "the published share";

  const sections: { title: string; items: Qa[] }[] = [
    {
      title: "Sessions & booking",
      items: [
        {
          q: "How do I book a yoga or nutrition session?",
          a: (
            <>
              Use the booking button on the{" "}
              <Link href="/yoga" className="font-semibold text-accent-text hover:underline">yoga</Link>,{" "}
              <Link href="/nutrition" className="font-semibold text-accent-text hover:underline">nutrition</Link> or{" "}
              <Link href="/nutrition/starting-solids" className="font-semibold text-accent-text hover:underline">starting solids</Link>{" "}
              page. It opens a conversation with us so we can check your stage
              and what you need before anything is confirmed.
            </>
          ),
          text: "Use the booking button on the yoga, nutrition or starting solids page. It opens a conversation with us so we can check your stage and what you need before anything is confirmed.",
        },
        {
          q: "Are the prices on the service pages final?",
          a: "They are starting prices. What you pay depends on the format, the session length and how much follow-up you want, and we confirm the figure with you before you book — never after.",
          text: "They are starting prices. What you pay depends on the format, the session length and how much follow-up you want, and we confirm the figure with you before you book — never after.",
        },
        {
          q: "Is this medical advice?",
          a: "No. Our yoga sessions are wellness and fitness support, and our nutrition guidance is practical food support. Anything involving a diagnosis, medication, a growth concern or a suspected allergy belongs with your doctor or paediatrician, and we will tell you when something is a question for them.",
          text: "No. Our yoga sessions are wellness and fitness support, and our nutrition guidance is practical food support. Anything involving a diagnosis, medication, a growth concern or a suspected allergy belongs with your doctor or paediatrician, and we will tell you when something is a question for them.",
        },
        {
          q: "I have a high-risk pregnancy. Can I still join a class?",
          a: "Please speak to your doctor first, and tell us anything we should work around. We would rather adapt a session than have you skip movement altogether, but that conversation starts with your clinician.",
          text: "Please speak to your doctor first, and tell us anything we should work around. We would rather adapt a session than have you skip movement altogether, but that conversation starts with your clinician.",
        },
      ],
    },
    {
      title: "The community",
      items: [
        {
          q: "Does the mom community cost anything?",
          a: (
            <>
              No. The{" "}
              <Link href="/community" className="font-semibold text-accent-text hover:underline">community</Link>{" "}
              is free to join and free to share with a friend. There is nothing
              to unlock before you can ask your first question.
            </>
          ),
          text: "No. The community is free to join and free to share with a friend. There is nothing to unlock before you can ask your first question.",
        },
        {
          q: "Is there a paid membership?",
          a: "Not yet. We are working on an optional paid layer with exclusive workshops, a resource library and member events. It is not open, and when it is you will hear about it inside the community first.",
          text: "Not yet. We are working on an optional paid layer with exclusive workshops, a resource library and member events. It is not open, and when it is you will hear about it inside the community first.",
        },
      ],
    },
    {
      title: "Buying preloved",
      items: [
        {
          q: "How do I pay?",
          a: "Online, through our secure payment gateway. There is no cash on delivery — your order is confirmed the moment payment clears, which is also what tells the seller to start packing.",
          text: "Online, through our secure payment gateway. There is no cash on delivery — your order is confirmed the moment payment clears, which is also what tells the seller to start packing.",
        },
        {
          q: "Who actually sells the item?",
          a: "Another mom. We are the marketplace, not the seller: each item is owned, described and photographed by an individual seller whose account we verify. Every listing is reviewed by us before it goes live.",
          text: "Another mom. We are the marketplace, not the seller: each item is owned, described and photographed by an individual seller whose account we verify. Every listing is reviewed by us before it goes live.",
        },
        {
          q: "Can I cancel an order?",
          a: (
            <>
              Yes, within {cutoff} of placing it, and a cancellation inside that
              window is refunded at {refundShare}. After that the seller may
              already be preparing the parcel, so it has to go through us.{" "}
              <Link href="/refunds" className="font-semibold text-accent-text hover:underline">
                Full refund policy
              </Link>
              .
            </>
          ),
          text: `Yes, within ${cutoff} of placing it, and a cancellation inside that window is refunded at ${refundShare}. After that the seller may already be preparing the parcel, so it has to go through us.`,
        },
        {
          q: "How does delivery work?",
          a: "The seller packs the item and ships it with a shipping label we generate, so the parcel is traceable from our side rather than theirs. You can confirm delivery yourself from your order page once it arrives.",
          text: "The seller packs the item and ships it with a shipping label we generate, so the parcel is traceable from our side rather than theirs. You can confirm delivery yourself from your order page once it arrives.",
        },
      ],
    },
    {
      title: "Selling preloved",
      items: [
        {
          q: "What does it cost to sell?",
          a: (
            <>
              A one-time {formatPaise(REGISTRATION_FEE_PAISE)} registration fee
              to verify your seller account, then a membership plan starting at{" "}
              {formatPaise(MEMBERSHIP_PLANS.MONTHLY.priceInPaise)} a month.
              Registration comes first, and you need an active plan to publish a
              listing.
            </>
          ),
          text: `A one-time ${formatPaise(REGISTRATION_FEE_PAISE)} registration fee to verify your seller account, then a membership plan starting at ${formatPaise(MEMBERSHIP_PLANS.MONTHLY.priceInPaise)} a month. Registration comes first, and you need an active plan to publish a listing.`,
        },
        {
          q: "When do I get paid?",
          a: "After the buyer's order is delivered. We hold the amount until then, take our commission, and transfer the rest to you with a reference you can check against your bank statement.",
          text: "After the buyer's order is delivered. We hold the amount until then, take our commission, and transfer the rest to you with a reference you can check against your bank statement.",
        },
        {
          q: "Why was my listing not approved?",
          a: (
            <>
              Every listing is reviewed before it goes live, and we tell you the
              reason if one is turned down — usually photos that are not of the
              actual item, or a condition description that does not match them.
              Fix it and resubmit. The{" "}
              <Link href="/policies" className="font-semibold text-accent-text hover:underline">
                marketplace policies
              </Link>{" "}
              set out what we look for.
            </>
          ),
          text: "Every listing is reviewed before it goes live, and we tell you the reason if one is turned down — usually photos that are not of the actual item, or a condition description that does not match them. Fix it and resubmit.",
        },
      ],
    },
  ];

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
          Sessions, the community, and buying or selling preloved — the things
          moms ask us most.
        </p>

        {sections.map((section) => (
          <section key={section.title} className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {section.title}
            </h2>
            <dl className="mt-5 space-y-4">
              {section.items.map((item) => (
                <div
                  key={item.q}
                  className="rounded-[1.5rem] border-2 border-border bg-surface p-6 card-shadow"
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

        <section className="mt-14 rounded-[1.75rem] border-2 border-border bg-surface-2 p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Still stuck?
          </h2>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted-foreground">
            Ask us directly — we would rather answer a question twice than have
            you guess.
          </p>
          <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
            Send us a message
          </Link>
        </section>
      </Container>
    </>
  );
}
