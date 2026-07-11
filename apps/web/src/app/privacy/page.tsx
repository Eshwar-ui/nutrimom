import { LegalDoc, type LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Privacy Policy", robots: { index: false, follow: false } };

const sections: LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <p>
        Account details (name, email, password hash), profile details you add
        (WhatsApp number, city, bio), listing content and images you upload,
        shipping addresses, and order history. We do not collect or store your
        card or bank details — those are handled directly by Razorpay.
      </p>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <p>
        To operate the marketplace: show your listings to buyers, process
        orders and payments, send order/listing notifications, moderate
        content, and respond to support requests. We do not sell your personal
        data to third parties.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Sharing",
    body: (
      <p>
        Your name and city are visible on your public seller profile. Your
        WhatsApp number is shared with a buyer only when you list it on an
        item. Payment data is shared with Razorpay solely to process the
        transaction. We may share data with authorities if legally required.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <p>
        Under India&apos;s Digital Personal Data Protection Act, 2023, you can
        request access to, correction of, or deletion of your personal data by
        contacting our Grievance Officer below.
      </p>
    ),
  },
  {
    id: "data-retention",
    title: "Data retention",
    body: (
      <p>
        We retain account and order data for as long as your account is active
        and as required to meet our legal and tax obligations, after which it
        is deleted or anonymized.
      </p>
    ),
  },
  {
    id: "grievance-officer",
    title: "Grievance Officer",
    body: (
      <p>
        The marketplace operator must publish the appointed Grievance Officer,
        registered address and verified grievance email before public launch.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      lastUpdated="11 July 2026"
      currentHref="/privacy"
      intro="What we collect, how we use it, and the choices you have over your personal data."
      sections={sections}
    />
  );
}
