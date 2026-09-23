import { Container } from "@/components/ui/primitives";
import {
  ServiceHero,
  IncludesList,
  PricingTable,
  SafetyNote,
  BookingCta,
  ClosingCta,
} from "@/components/service-sections";
import { bookingWhatsappUrl } from "@/lib/booking";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";

/**
 * A landing page of its own rather than a section of /nutrition, because
 * baby-food content is the single highest-intent traffic source in the
 * founders' brief (§6): a reel about first foods should land on a page about
 * first foods with one button on it, not on a general nutrition menu.
 */
export const metadata = pageMetadata({
  title: "Starting Solids Session",
  description:
    "A 60-minute Starting Solids session: readiness, first foods, textures, allergens, meal ideas and responsive feeding — personalised to your baby's stage.",
  path: "/nutrition/starting-solids",
});

const includes = [
  "Readiness guidance and how to prepare for the transition.",
  "First foods and simple combinations that work.",
  "Texture progression and responsive feeding principles.",
  "Age-appropriate meal ideas and routines.",
  "Allergen-introduction guidance, and what to raise with your paediatrician.",
  "Common feeding concerns and practical troubleshooting.",
  "A personalised discussion based on your baby's stage and your family's routine.",
];

export default async function StartingSolidsPage() {
  const whatsappUrl = await bookingWhatsappUrl("solids");

  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd({
            name: "Starting Solids Session",
            description:
              "A 60-minute session on readiness, first foods, textures, allergens, meal ideas and responsive feeding, personalised to your baby's stage.",
            path: "/nutrition/starting-solids",
            serviceType: "Infant feeding consultation",
            offerings: includes,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Nutrition", path: "/nutrition" },
            { name: "Starting Solids", path: "/nutrition/starting-solids" },
          ]),
        ]}
      />
    <Container className="max-w-4xl py-12 sm:py-16">
      <ServiceHero
        eyebrow="Nourish · Starting Solids"
        title="Starting solids doesn't have to feel confusing"
        subtitle="Practical guidance on readiness, first foods, textures, meal ideas and all the questions that come with the first spoon."
      >
        <BookingCta
          intent="solids"
          label="Book a Starting Solids session"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/nutrition", label: "All nutrition support" }}
        />
      </ServiceHero>

      <IncludesList heading="What the session includes" items={includes} />

      <PricingTable
        heading="What it costs"
        rows={[{ label: "60-minute 1:1 session", price: "₹799" }]}
        note="A lower-cost group workshop is planned once there's enough demand — ask us if you'd prefer that."
      />

      <SafetyNote>
        This is practical feeding guidance, not medical advice. Allergies,
        reflux, growth concerns and anything to do with your baby&apos;s health
        belong with your paediatrician — we&apos;ll help you arrive at that
        conversation with the right questions.
      </SafetyNote>

      <ClosingCta
        title="First spoons, sorted"
        body="One session, your baby's stage, and a plan you can actually cook from this week."
      >
        <BookingCta
          intent="solids"
          label="Book a Starting Solids session"
          whatsappUrl={whatsappUrl}
        />
      </ClosingCta>
      </Container>
    </>
  );
}
