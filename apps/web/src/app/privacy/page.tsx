import { Container } from "@/components/ui/primitives";
import { LegalPlaceholderBanner } from "@/components/legal-placeholder-banner";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: [DATE]</p>
      <LegalPlaceholderBanner />

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">1. What we collect</h2>
          <p>
            Account details (name, email, password hash), profile details you add
            (WhatsApp number, city, bio), listing content and images you upload,
            shipping addresses, and order history. We do not collect or store your
            card or bank details — those are handled directly by Razorpay.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">2. How we use it</h2>
          <p>
            To operate the marketplace: show your listings to buyers, process
            orders and payments, send order/listing notifications, moderate
            content, and respond to support requests. We do not sell your personal
            data to third parties.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">3. Sharing</h2>
          <p>
            Your name and city are visible on your public seller profile. Your
            WhatsApp number is shared with a buyer only when you list it on an
            item. Payment data is shared with Razorpay solely to process the
            transaction. We may share data with authorities if legally required.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">4. Your rights</h2>
          <p>
            Under India&apos;s Digital Personal Data Protection Act, 2023, you can
            request access to, correction of, or deletion of your personal data by
            contacting our Grievance Officer below.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">5. Data retention</h2>
          <p>
            We retain account and order data for as long as your account is active
            and as required to meet our legal and tax obligations, after which it
            is deleted or anonymized.
          </p>
        </section>
        <section>
          <h2 className="mb-1.5 font-display text-lg font-semibold text-foreground">6. Grievance Officer</h2>
          <p>
            [GRIEVANCE OFFICER NAME]<br />
            [LEGAL ENTITY NAME]<br />
            [REGISTERED ADDRESS]<br />
            Email: [GRIEVANCE OFFICER EMAIL]
          </p>
        </section>
      </div>
    </Container>
  );
}
