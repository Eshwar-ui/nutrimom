import { LegalDoc, type LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Refund & Cancellation Policy", robots: { index: false, follow: false } };

const sections: LegalSection[] = [
  {
    id: "cancelling-an-order",
    title: "Cancelling an order",
    body: (
      <p>
        You can cancel an order yourself from{" "}
        <a href="/account/orders">My orders</a> any time before it has been
        marked shipped. Once shipped, contact the seller directly and use the
        Contact page to document the issue.
      </p>
    ),
  },
  {
    id: "refund-timeline",
    title: "Refund timeline",
    body: (
      <p>
        Refunds for cancelled or paid-but-unfulfilled orders are initiated to
        your original payment method within [X] business days of approval, and
        typically reflect in your account within [X]&ndash;[X] business days
        depending on your bank.
      </p>
    ),
  },
  {
    id: "returns-for-item-condition",
    title: "Returns for item condition",
    body: (
      <p>
        Because items are secondhand and described by individual sellers, we
        recommend reviewing photos and messaging the seller before buying. If an
        item arrives significantly different from its listing, contact us within
        [X] days of delivery with photos — we&apos;ll review on a case-by-case
        basis.
      </p>
    ),
  },
  {
    id: "non-refundable-situations",
    title: "Non-refundable situations",
    body: (
      <p>
        Change-of-mind returns after delivery, items marked as final sale, and
        orders cancelled by the buyer after handover has already occurred are
        not eligible for a refund.
      </p>
    ),
  },
  {
    id: "how-to-request-a-refund",
    title: "How to request a refund",
    body: (
      <p>
        Use the Contact page with your order number and reason. See our{" "}
        <a href="/contact">Contact page</a> for other ways to reach us.
      </p>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalDoc
      title="Refund & Cancellation Policy"
      lastUpdated="11 July 2026"
      currentHref="/refunds"
      intro="How cancellations, refunds, and condition disputes are handled on the marketplace."
      sections={sections}
    />
  );
}
