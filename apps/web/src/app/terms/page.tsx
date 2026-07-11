import { LegalDoc, type LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Terms & Conditions", robots: { index: false, follow: false } };

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        The marketplace operator runs this Platform under the brand The Nurture Moms.
        Its verified legal name, registration number, registered office and public
        website address must be inserted after legal review and before launch.
      </p>
    ),
  },
  {
    id: "what-the-platform-is",
    title: "What the Platform is",
    body: (
      <p>
        The Nurture Moms is a peer-to-peer marketplace connecting individuals who
        want to sell gently used baby and maternity items with buyers. We are an
        intermediary, not the seller of any listed item — each listing is created
        and owned by an individual user.
      </p>
    ),
  },
  {
    id: "account-eligibility",
    title: "Account & eligibility",
    body: (
      <p>
        You must be at least 18 years old and capable of entering a binding
        contract under the Indian Contract Act, 1872 to register. You are
        responsible for the accuracy of the information you provide and for
        keeping your account credentials confidential.
      </p>
    ),
  },
  {
    id: "listings-conduct",
    title: "Listings & conduct",
    body: (
      <p>
        Sellers must describe items accurately and honestly, including condition
        and any defects. Listing counterfeit, unsafe, recalled, or prohibited
        items is not allowed and may result in removal and account suspension.
      </p>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <p>
        Online payments are processed by Razorpay Software Private Limited. The
        Platform does not store your card or bank details. See our{" "}
        <a href="/refunds">Refund &amp; Cancellation Policy</a> for how order
        cancellations are handled.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, the marketplace operator is not liable
        for the condition, safety, or legality of items listed by third-party
        sellers, or for disputes between buyers and sellers arising from a
        transaction.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India. Any dispute shall be
        subject to the exclusive jurisdiction of the courts of [CITY, STATE].
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms can be raised through our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms & Conditions"
      lastUpdated="11 July 2026"
      currentHref="/terms"
      intro="The ground rules for using The Nurture Moms as a buyer or a seller."
      sections={sections}
    />
  );
}
