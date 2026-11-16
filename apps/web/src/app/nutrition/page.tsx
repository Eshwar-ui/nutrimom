import { Apple, Baby, HeartPulse, Soup, Utensils, MessageSquareHeart } from "lucide-react";
import type { ServiceGroup } from "@nutrimom/shared";
import { Container } from "@/components/ui/primitives";
import { HeroWave } from "@/components/section-wave";
import {
  ServiceHero,
  OfferingGrid,
  SafetyNote,
  BookingCta,
  ClosingCta,
  type Offering,
} from "@/components/service-sections";
import { FreeGuideCallout } from "@/components/resource-cards";
import { PackagePricing } from "@/components/package-pricing";
import { ServiceFaqs } from "@/components/service-faqs";
import { bookingPhone, bookingWhatsappUrl } from "@/lib/booking";
import { getFaqs, getServicePackages } from "@/lib/content";
import { SERVICE_OG_IMAGES, pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ArtDirectedImage } from "@/components/art-directed-image";

export const metadata = pageMetadata({
  title: "Nutrition for Mom & Baby",
  description:
    "Practical, judgment-free nutrition for pregnancy, postpartum recovery, starting solids and toddler meals — 1:1 consultations with moms who've been there.",
  path: "/nutrition",
  images: [SERVICE_OG_IMAGES.nutrition],
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
      image: "/images/category-prenatal.webp",
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
      image: "/images/category-postnatal.webp",
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
      image: "/images/category-baby-nutrition.webp",
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
      image: "/images/category-baby-nutrition.webp",
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
      image: "/images/category-wellness.webp",
    },
    title: "1:1 Consultations",
    body: "Personalised support based on your family's goals, routine and needs.",
  },
];

// Starting Solids is the same package /nutrition/starting-solids shows — one
// row in the admin, so the two pages can't quote different prices.
const NUTRITION_GROUPS: readonly ServiceGroup[] = ["NUTRITION", "STARTING_SOLIDS"];

const GROUP_COPY: Partial<Record<ServiceGroup, string>> = {
  NUTRITION:
    "Practical, judgment-free support for pregnancy, postpartum, babies and toddlers.",
  STARTING_SOLIDS:
    "Readiness, first foods, textures and allergens, personalised to your baby's stage.",
};

export default async function NutritionPage() {
  const [whatsappUrl, phone, packages, faqs] = await Promise.all([
    bookingWhatsappUrl("nutrition"),
    bookingPhone(),
    getServicePackages(),
    getFaqs("NUTRITION"),
  ]);
  const nutritionPackages = packages.filter((p) => NUTRITION_GROUPS.includes(p.group));
  // The "we'll confirm" note belongs only to prices the admin has marked as a
  // starting price — said in the package's own summary — never to a fixed fee.
  const hasStartingPrices = nutritionPackages.some((p) => /starting price/i.test(p.summary));

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
        <ArtDirectedImage
          alt="A mother and baby sharing a nourishing meal"
          desktop={{ src: "/hero-images/nutrition-desktop.webp", width: 1600, height: 653 }}
          tablet={{ src: "/hero-images/nutrition-tablet.webp", width: 1536, height: 1024 }}
          mobile={{ src: "/hero-images/nutrition-mobile.webp", width: 941, height: 1672 }}
          eager
          className="block h-auto w-full"
        />
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

      <PackagePricing
        heading="Pricing"
        intro="Book Now opens WhatsApp with your package and price already filled in — there's nothing to pay online here."
        packages={nutritionPackages}
        groups={NUTRITION_GROUPS}
        groupCopy={GROUP_COPY}
        phone={phone}
        footnote={
          hasStartingPrices
            ? "Where a package says “Starting price”, the final fee depends on the format and how much follow-up you'd like — we'll confirm it before you book."
            : undefined
        }
      />

      <ServiceFaqs heading="Nutrition questions" faqs={faqs} />

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
