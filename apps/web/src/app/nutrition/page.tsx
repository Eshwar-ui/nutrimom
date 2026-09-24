import { Apple, Baby, HeartPulse, Soup, Utensils, MessageSquareHeart } from "lucide-react";
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
import { FreeGuideCallout } from "@/components/resource-cards";
import { bookingWhatsappUrl } from "@/lib/booking";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";

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
    borderColor: "border-blush/70",
    illustration: {
      primary: Apple,
      secondary: Soup,
      label: "Nourish + prepare",
      detail: "Practical food support for every trimester.",
      surface: "bg-blush/45",
      image: "/images/category-prenatal.png",
    },
    title: "Pregnancy Nutrition",
    body: "Practical guidance for everyday nourishment through pregnancy.",
  },
  {
    icon: Soup,
    tint: "bg-sage/60",
    borderColor: "border-sage/70",
    illustration: {
      primary: Soup,
      secondary: HeartPulse,
      label: "Recover + restore",
      detail: "Realistic nourishment for new-mom recovery.",
      surface: "bg-sage/45",
      image: "/images/category-postnatal.png",
    },
    title: "Postpartum Nutrition",
    body: "Recovery-focused, realistic food guidance for new moms.",
  },
  {
    icon: Utensils,
    tint: "bg-sky/60",
    borderColor: "border-sky/70",
    gridClassName: "lg:col-start-3 lg:row-start-1 lg:row-span-2",
    illustrationClassName: "lg:min-h-[14.5rem] lg:p-6",
    illustrationImageClassName: "lg:-bottom-10 lg:-right-6 lg:h-56 lg:w-56",
    illustration: {
      primary: Utensils,
      secondary: Baby,
      label: "First foods",
      detail: "Textures, allergens and meals made less confusing.",
      surface: "bg-sky/45",
      image: "/images/category-baby-nutrition.png",
    },
    title: "Starting Solids",
    body: "Readiness, first foods, textures, meal ideas, allergens and the questions everyone has.",
    href: "/nutrition/starting-solids",
  },
  {
    icon: Baby,
    tint: "bg-lavender/60",
    borderColor: "border-lavender/70",
    illustration: {
      primary: Baby,
      secondary: Apple,
      label: "Grow + explore",
      detail: "Age-appropriate feeding support as your child grows.",
      surface: "bg-lavender/45",
      image: "/images/category-baby-nutrition.png",
    },
    title: "Baby & Toddler Nutrition",
    body: "Practical, age-appropriate feeding support as your child grows.",
  },
  {
    icon: MessageSquareHeart,
    tint: "bg-beige",
    borderColor: "border-gold/70",
    illustration: {
      primary: MessageSquareHeart,
      secondary: HeartPulse,
      label: "Your family",
      detail: "Personalised support for your routine and goals.",
      surface: "bg-beige/70",
      image: "/images/category-wellness.png",
    },
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
      <JsonLd
        data={[
          serviceJsonLd({
            name: "Pregnancy & Baby Nutrition",
            description:
              "Nutrition guidance for pregnancy, postpartum recovery, starting solids and baby and toddler feeding, with 1:1 consultations.",
            path: "/nutrition",
            serviceType: "Maternal and infant nutrition guidance",
            offerings: services.map((s) => s.title),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Nutrition", path: "/nutrition" },
          ]),
        ]}
      />
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
        <div className="absolute inset-0">
          <Container className="flex h-full w-full flex-col items-stretch justify-start pt-10 sm:justify-center sm:pt-0">
            <ServiceHero
              eyebrow="Nourish"
              title="Nutrition for Mom & Baby"
              subtitle="Practical, judgment-free nutrition support for pregnancy, postpartum, babies and toddlers."
              subtitleClassName="max-w-md"
            >
              <BookingCta
                intent="nutrition"
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

      <OfferingGrid heading="How we can help" items={services} equalCards />

      <PricingTable
        rows={pricing}
        note="Starting prices. Final fees depend on the format and how much follow-up you'd like — we'll confirm before you book."
      />

      <FreeGuideCallout
        slugs={["pregnancy-wellness-guide", "postpartum-nourishment-guide"]}
        source="nutrition"
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
          intent="nutrition"
          label="Book a consultation"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/journal", label: "Read the Journal" }}
        />
      </ClosingCta>
      </Container>
    </>
  );
}
