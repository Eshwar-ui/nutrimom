import { Apple, Baby, Soup, Utensils, MessageSquareHeart } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { HeroWave } from "@/components/section-wave";
import {
  ServiceHero,
  OfferingGrid,
  PricingTable,
  SafetyNote,
  BookingCta,
  ClosingCta,
  type Offering,
} from "@/components/service-sections";
import { bookingWhatsappUrl } from "@/lib/booking";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Nutrition for Mom & Baby",
  description:
    "Practical, judgment-free nutrition support for pregnancy, postpartum recovery, starting solids and toddler feeding — 1:1 consultations with moms who have been there.",
  path: "/nutrition",
});

const services: Offering[] = [
  {
    icon: Apple,
    tint: "bg-blush/60",
    title: "Pregnancy Nutrition",
    body: "Practical guidance for everyday nourishment through pregnancy.",
  },
  {
    icon: Soup,
    tint: "bg-sage/60",
    title: "Postpartum Nutrition",
    body: "Recovery-focused, realistic food guidance for new moms.",
  },
  {
    icon: Utensils,
    tint: "bg-sky/60",
    title: "Starting Solids",
    body: "Readiness, first foods, textures, meal ideas, allergens and the questions everyone has.",
    href: "/nutrition/starting-solids",
  },
  {
    icon: Baby,
    tint: "bg-lavender/60",
    title: "Baby & Toddler Nutrition",
    body: "Practical, age-appropriate feeding support as your child grows.",
  },
  {
    icon: MessageSquareHeart,
    tint: "bg-beige",
    title: "1:1 Consultations",
    body: "Personalised support based on your family's goals, routine and needs.",
  },
];

const pricing = [
  { label: "Quick guidance", price: "₹299", from: true },
  { label: "1:1 consultation", price: "₹699", from: true },
  { label: "Starting Solids session", price: "₹799" },
  { label: "Mom + Baby bundle", price: "₹1,299", from: true },
  { label: "Monthly support", price: "₹1,499", from: true, unit: "per month" },
];

export default async function NutritionPage() {
  const whatsappUrl = await bookingWhatsappUrl("nutrition");

  return (
    <>
      <section className="relative overflow-hidden">
        <picture>
          <source media="(min-width: 1024px)" srcSet="/hero-images/nutrition-desktop.png" />
          <source media="(min-width: 768px)" srcSet="/hero-images/nutrition-tablet.png" />
          <img
            src="/hero-images/nutrition-mobile.png"
            alt="A mother and baby sharing a nourishing meal"
            className="block w-full"
          />
        </picture>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent"
        />
        <div className="absolute inset-0 flex items-center">
          <Container className="w-full">
            <ServiceHero
              eyebrow="Nourish"
              title="Nutrition for Mom & Baby"
              subtitle="Practical, judgment-free nutrition support for pregnancy, postpartum, babies and toddlers."
              subtitleClassName="max-w-md"
            >
              <BookingCta
                label="Book a nutrition consultation"
                whatsappUrl={whatsappUrl}
                secondary={{
                  href: "/nutrition/starting-solids",
                  label: "Starting solids?",
                }}
              />
            </ServiceHero>
          </Container>
        </div>
        <HeroWave />
      </section>

      <Container className="py-12 sm:py-16">

      <OfferingGrid heading="How we can help" items={services} />

      <PricingTable
        rows={pricing}
        note="Starting prices. Final fees depend on the format and how much follow-up you'd like — we'll confirm before you book."
      />

      <SafetyNote>
        Nutrition guidance from The Nurture Moms is practical food support, not
        medical or clinical advice. Anything to do with a diagnosis, medication,
        a growth concern or a suspected allergy belongs with your paediatrician
        or doctor — we&apos;ll always tell you when something is a question for them.
      </SafetyNote>

      <ClosingCta
        title="Tell us where you are"
        body="Pregnancy, the fourth trimester, first spoons or a fussy toddler — we'll start from wherever you actually are."
      >
        <BookingCta
          label="Book a consultation"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/journal", label: "Read the Journal" }}
        />
      </ClosingCta>
      </Container>
    </>
  );
}
