import { Container } from "@/components/ui/primitives";
import { LegalPlaceholderBanner } from "@/components/legal-placeholder-banner";

export const metadata = { title: "Refund & Cancellation Policy", robots: { index: false, follow: false } };

export default function RefundsPage() {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">Refund &amp; Cancellation Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 11 July 2026</p>
      <LegalPlaceholderBanner />

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">1. Cancelling an order</h2>
          <p>
            You can cancel an order yourself from{" "}
            <a href="/account/orders" className="text-accent-text hover:underline">My orders</a>{" "}
            any time before it has been marked shipped. Once shipped, contact the
            seller directly and use the Contact page to document the issue.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">2. Refund timeline</h2>
          <p>
            Refunds for cancelled or paid-but-unfulfilled orders are initiated to
            your original payment method within [X] business days of approval, and
            typically reflect in your account within [X]&ndash;[X] business days
            depending on your bank.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">3. Returns for item condition</h2>
          <p>
            Because items are secondhand and described by individual sellers, we
            recommend reviewing photos and messaging the seller before buying. If an
            item arrives significantly different from its listing, contact us within
            [X] days of delivery with photos — we&apos;ll review on a case-by-case
            basis.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">4. Non-refundable situations</h2>
          <p>
            Change-of-mind returns after delivery, items marked as final sale, and
            orders cancelled by the buyer after handover has already occurred are
            not eligible for a refund.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">5. How to request a refund</h2>
          <p>
            Use the Contact page with your order number and reason. See our{" "}
            <a href="/contact" className="text-accent-text hover:underline">Contact page</a>{" "}
            for other ways to reach us.
          </p>
        </section>
      </div>
    </Container>
  );
}
