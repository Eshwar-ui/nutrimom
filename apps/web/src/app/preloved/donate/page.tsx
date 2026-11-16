import { BookOpen, ClipboardList, Gift, HandHeart, Heart, PhoneCall, ShieldAlert, Shirt, ToyBrick } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { ServiceHero } from "@/components/service-sections";
import { DonationForm } from "@/components/donation-form";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { SERVICE_OG_IMAGES, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Donate baby, kids & maternity items",
  description:
    "Pass on gently used baby clothes, toys, books and essentials to a mom who needs them. Share a few details and we'll arrange the match and the handover.",
  path: "/preloved/donate",
  images: [SERVICE_OG_IMAGES.preloved],
});

// PLACEHOLDER — the founders must supply the final list of items accepted for
// donation (and any exclusions). This covers the common cases from the brief
// so the page isn't empty; replace it with the client's list before launch.
const ACCEPTED = [
  { icon: Shirt, title: "Clothes", body: "Clean, wearable baby and kids' clothes, and maternity wear." },
  { icon: ToyBrick, title: "Toys", body: "Complete, working toys without loose small parts or sharp edges." },
  { icon: BookOpen, title: "Books", body: "Board books, picture books and story books with all their pages." },
  { icon: Gift, title: "Everyday essentials", body: "Swaddles, blankets, bibs, nursing covers and similar gently used basics." },
] as const;

const STEPS = [
  { icon: ClipboardList, title: "Share the details", body: "Tell us what you'd like to pass on, where you are, and add a photo or two if you can." },
  { icon: PhoneCall, title: "We get in touch", body: "Someone from our team calls or messages you to talk it through — usually within a few days." },
  { icon: Heart, title: "We find a mom who needs it", body: "We match your item with a mom in our community who's looking for exactly that." },
  { icon: HandHeart, title: "Handover", body: "We arrange a pickup or drop-off that suits you. No fees and no selling — just passing it on." },
] as const;

/**
 * Donations are matched by hand (REDESIGN-PLAN.md decision 4): this page feeds
 * the admin queue at /admin/donations. Nothing here becomes a public listing.
 * The explainer is public and indexable; only the form needs a login, and it
 * sends a signed-out visitor to /login?next=/preloved/donate.
 */
export default function DonatePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Preloved", path: "/preloved" },
          { name: "Donate an item", path: "/preloved/donate" },
        ])}
      />
      <Container className="py-12 sm:py-16">
        <ServiceHero
          eyebrow="Pass it on"
          title="Donate an item"
          subtitle="Babies outgrow things long before those things wear out. If you have something your family no longer needs, we'll help it reach a mom who'll treasure it just as much as you did."
        />

        <section aria-labelledby="donate-steps" className="mt-section">
          <h2 id="donate-steps" className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            How donating works
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative rounded-card border border-border bg-surface p-5">
                <span className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage/60 text-sage-ink">
                    <step.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="donate-accepted" className="mt-section">
          <h2 id="donate-accepted" className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            What you can donate
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Anything clean, safe and still useful — the kind of thing you&apos;d be happy to receive yourself.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACCEPTED.map((item) => (
              <li key={item.title} className="rounded-card border border-border bg-surface p-5">
                <item.icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
                <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
          <aside className="mt-4 flex gap-3 rounded-card border border-border bg-beige/50 p-5 text-beige-ink">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Car seats, cots, strollers and other safety items:</span>{" "}please check with
              us before offering one. We can only pass these on when we know their history — that they&apos;ve never been
              in an accident and nothing is missing or recalled.
            </p>
          </aside>
        </section>

        <section id="donate-form" aria-labelledby="donate-form-heading" className="mt-section scroll-mt-24">
          <div className="mx-auto max-w-3xl">
            <h2 id="donate-form-heading" className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Tell us about your item
            </h2>
            <p className="mt-2 text-muted-foreground">
              It takes a couple of minutes. Your phone number and PIN code are only seen by our team.
            </p>
            <div className="mt-6">
              <DonationForm />
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
