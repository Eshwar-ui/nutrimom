import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { ContactForm } from "@/components/contact-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Delete your account",
  description: "Request deletion of your The Nurture Moms account and personal data.",
  path: "/account-deletion",
});

export default function AccountDeletionPage() {
  return (
    <main>
      <Container className="max-w-4xl py-14 sm:py-20">
        <Link href="/privacy" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline">
          <ArrowLeft className="h-4 w-4" /> Privacy policy
        </Link>
        <div className="mt-8 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-1.5 text-xs font-bold text-primary">
            <ShieldAlert className="h-3.5 w-3.5" /> Account controls
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">Delete your account</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            You can permanently delete your The Nurture Moms account from the mobile app: open <strong className="font-semibold text-foreground">Account</strong>, choose <strong className="font-semibold text-foreground">Delete account</strong>, and confirm.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            "Your profile, seller details and active sessions are removed.",
            "Orders and payment records are retained only where required for legal, tax or fraud-prevention obligations, and are anonymized.",
            "Deletion is irreversible. Contact support first if you need help with an open order or refund.",
          ].map((copy) => (
            <div key={copy} className="rounded-2xl border-2 border-border bg-surface p-5 card-shadow">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>

        <section className="mt-12 overflow-hidden rounded-panel border-2 border-border bg-surface card-shadow">
          <div className="bg-primary p-7 text-primary-foreground sm:p-9">
            <h2 className="font-display text-2xl font-semibold">Can&apos;t access the app?</h2>
            <p className="mt-2 max-w-xl leading-relaxed text-primary-foreground/80">
              Send a deletion request below using the email address on your account. We&apos;ll verify ownership and process it through support.
            </p>
          </div>
          <ContactForm initialTopic="Account deletion request" />
        </section>
      </Container>
    </main>
  );
}
