import { Container } from "@/components/ui/primitives";
import { LegalPlaceholderBanner } from "@/components/legal-placeholder-banner";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: [DATE]</p>
      <LegalPlaceholderBanner />

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">1. Who we are</h2>
          <p>
            [LEGAL ENTITY NAME], a company registered in India (CIN: [CIN NUMBER]),
            with its registered office at [REGISTERED ADDRESS], operates the website
            [WEBSITE URL] (&quot;the Platform&quot;) under the brand The Nurture Moms.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">2. What the Platform is</h2>
          <p>
            The Nurture Moms is a peer-to-peer marketplace connecting individuals who
            want to sell gently used baby and maternity items with buyers. We are an
            intermediary, not the seller of any listed item — each listing is created
            and owned by an individual user.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">3. Account &amp; eligibility</h2>
          <p>
            You must be at least 18 years old and capable of entering a binding
            contract under the Indian Contract Act, 1872 to register. You are
            responsible for the accuracy of the information you provide and for
            keeping your account credentials confidential.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">4. Listings &amp; conduct</h2>
          <p>
            Sellers must describe items accurately and honestly, including condition
            and any defects. Listing counterfeit, unsafe, recalled, or prohibited
            items is not allowed and may result in removal and account suspension.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">5. Payments</h2>
          <p>
            Online payments are processed by Razorpay Software Private Limited. The
            Platform does not store your card or bank details. See our{" "}
            <a href="/refunds" className="text-accent hover:underline">Refund &amp; Cancellation Policy</a>{" "}
            for how order cancellations are handled.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">6. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, [LEGAL ENTITY NAME] is not liable
            for the condition, safety, or legality of items listed by third-party
            sellers, or for disputes between buyers and sellers arising from a
            transaction.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">7. Governing law</h2>
          <p>
            These terms are governed by the laws of India. Any dispute shall be
            subject to the exclusive jurisdiction of the courts of [CITY, STATE].
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">8. Contact</h2>
          <p>
            Questions about these terms can be sent to [SUPPORT EMAIL] — see our{" "}
            <a href="/contact" className="text-accent hover:underline">Contact page</a>.
          </p>
        </section>
      </div>
    </Container>
  );
}
