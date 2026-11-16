import {
  Clock3,
  Flower2,
  Heart,
  HeartPulse,
  MessageCircle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Users,
  UserRound,
  Video,
  Wind,
} from "lucide-react";
import Link from "next/link";
import type { ServiceGroup } from "@nutrimom/shared";
import { Container } from "@/components/ui/primitives";
import { HeroWave } from "@/components/section-wave";
import {
  ServiceHero,
  CredentialStrip,
  OfferingGrid,
  SafetyNote,
  BookingCta,
  ClosingCta,
  type Offering,
} from "@/components/service-sections";
import { FreeGuideCallout } from "@/components/resource-cards";
import { PackagePricing } from "@/components/package-pricing";
import { ServiceFaqs } from "@/components/service-faqs";
import { MarkdownContent } from "@/components/markdown-content";
import { TrackedExternalLink, TrackedLink } from "@/components/tracked-link";
import { bookingPhone, bookingWhatsappUrl } from "@/lib/booking";
import { getFaqs, getServicePackages, getSiteContent } from "@/lib/content";
import { ENQUIRY_SERVICE_SLUGS } from "@/lib/site-nav";
import { SERVICE_OG_IMAGES, pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { ArtDirectedImage } from "@/components/art-directed-image";

export const metadata = pageMetadata({
  title: "Yoga & Garbhasanskar",
  description:
    "Prenatal & postnatal yoga, Garbhasanskar and 1:1 sessions for Indian moms — live group batches and recorded practice, through pregnancy and beyond.",
  path: "/yoga",
  images: [SERVICE_OG_IMAGES.yoga],
});

// Credentials the founders' brief lists for the yoga pillar. Flagged there as
// needing confirmation before publication — see RESTRUCTURE-PLAN.md, open
// question 3. Nothing beyond this list should be added without a source.
const credentials = [
  "200-Hour Yoga Certification",
  "Prenatal & Postnatal Training",
  "Garbhasanskar",
];

const offerings: Offering[] = [
  {
    icon: Flower2,
    tint: "bg-blush/60",
    illustration: {
      primary: Flower2,
      secondary: Wind,
      label: "Move + breathe",
      detail: "Gentle movement shaped around each trimester.",
      surface: "bg-blush/45",
      image: "/images/yoga/prenatal-yoga.webp",
    },
    title: "Prenatal Yoga",
    body: "Trimester-aware movement, breathwork, relaxation and mobility for pregnancy.",
  },
  {
    icon: HeartPulse,
    tint: "bg-sage/60",
    illustration: {
      primary: HeartPulse,
      secondary: RotateCcw,
      label: "Restore + rebuild",
      detail: "Steady recovery, mobility and strength after birth.",
      surface: "bg-sage/45",
      image: "/images/yoga/postnatal-yoga.webp",
    },
    title: "Postnatal Yoga",
    body: "Gentle recovery, mobility, strength and core-focused movement as appropriate.",
  },
  {
    icon: Sparkles,
    tint: "bg-lavender/60",
    illustration: {
      primary: Sparkles,
      secondary: Heart,
      label: "Connect + calm",
      detail: "Mindful practices for a calmer pregnancy experience.",
      surface: "bg-lavender/45",
      image: "/images/yoga/garbhasanskar.webp",
    },
    title: "Garbhasanskar",
    body: "Breathwork, affirmations, relaxation and mindful pregnancy practices.",
  },
  {
    icon: Users,
    tint: "bg-sky/60",
    illustration: {
      primary: Users,
      secondary: Video,
      label: "Together, live",
      detail: "Small groups with guidance and a clear sequence.",
      surface: "bg-sky/45",
      image: "/images/yoga/live-group-yoga.webp",
    },
    title: "Live Group Batches",
    body: "Small-group sessions with live guidance and structured sequencing.",
  },
  {
    icon: PlayCircle,
    tint: "bg-beige",
    illustration: {
      primary: PlayCircle,
      secondary: Clock3,
      label: "Your time",
      detail: "Press play whenever your day gives you space.",
      surface: "bg-beige/70",
      image: "/images/yoga/recorded-yoga.webp",
    },
    title: "Recorded Sessions",
    body: "Practise at a time that suits you, with pregnancy and postpartum resources.",
  },
  {
    icon: UserRound,
    tint: "bg-blush/60",
    illustration: {
      primary: UserRound,
      secondary: MessageCircle,
      label: "Just for you",
      detail: "A focused session around your goals and needs.",
      surface: "bg-blush/45",
      image: "/images/yoga/one-to-one-yoga.webp",
    },
    title: "1:1 Sessions",
    body: "Personalised sessions for individual goals and needs, with medical clearance where appropriate.",
  },
];

/**
 * The brief's page order (§8): A Prenatal Yoga, B Garbhasanskar, C the two
 * together, D 1:1. The Best value package (the Monthly Combo) is lifted into
 * the Recommended block above all four, so C only shows here if it holds
 * anything else.
 */
const YOGA_GROUPS: readonly ServiceGroup[] = [
  "PRENATAL_YOGA",
  "GARBHASANSKAR",
  "COMBO",
  "ONE_TO_ONE_YOGA",
];

// Brief §8's own wording for each group.
const GROUP_COPY: Partial<Record<ServiceGroup, string>> = {
  PRENATAL_YOGA:
    "Classes may include pregnancy-appropriate movement, breathing practices and relaxation.",
  GARBHASANSKAR:
    "Sessions may include guided affirmations, relaxation, mindful pregnancy practices and emotional bonding activities.",
  COMBO: "Prenatal Yoga and Garbhasanskar together, in one package.",
  ONE_TO_ONE_YOGA: "Personalised support adapted to your needs and comfort level.",
};

export default async function YogaPage() {
  const [whatsappUrl, phone, packages, content, faqs] = await Promise.all([
    bookingWhatsappUrl("yoga"),
    bookingPhone(),
    getServicePackages(),
    getSiteContent(),
    getFaqs("SESSIONS"),
  ]);
  const yogaPackages = packages.filter((p) => YOGA_GROUPS.includes(p.group));
  const sessionPolicy = content?.sessionPolicy?.trim();

  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd({
            name: "Prenatal & Postnatal Yoga",
            description:
              "Trimester-aware prenatal yoga, postnatal recovery, Garbhasanskar and 1:1 sessions, live online and recorded.",
            path: "/yoga",
            serviceType: "Prenatal and postnatal yoga",
            offerings: offerings.map((o) => o.title),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Yoga", path: "/yoga" },
          ]),
        ]}
      />
      <section className="relative overflow-hidden">
        <ArtDirectedImage
          alt="A mother practicing gentle prenatal yoga"
          desktop={{ src: "/hero-images/yoga-desktop.webp", width: 1600, height: 600 }}
          tablet={{ src: "/hero-images/yoga-tablet.webp", width: 1536, height: 1024 }}
          mobile={{ src: "/hero-images/yoga-mobile.webp", width: 941, height: 1672 }}
          eager
          className="block h-auto w-full"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent"
        />
        <div className="absolute inset-0">
          <Container className="flex h-full items-start pt-14 sm:pt-20 md:pt-24 lg:pt-28">
            <ServiceHero
              eyebrow="Move"
              title="Yoga for every stage of motherhood"
              subtitle="Move, breathe and reconnect with yourself through pregnancy, postpartum recovery and beyond."
            >
              <BookingCta
          intent="yoga"
                label="View classes & book a session"
                whatsappUrl={whatsappUrl}
                secondary={
                  yogaPackages.length > 0
                    ? { href: "#packages", label: "See packages & prices" }
                    : { href: "/nutrition", label: "Explore Nutrition" }
                }
              />
            </ServiceHero>
          </Container>
        </div>
        <HeroWave />
      </section>

      <Container className="py-12 sm:py-16">
        <CredentialStrip items={credentials} />

        <OfferingGrid heading="What we offer" items={offerings} />

        <PackagePricing
          heading="Packages & pricing"
          intro="Choose one practice, or bring both together. Book Now opens WhatsApp with your package and price already filled in — there's nothing to pay online here."
          packages={yogaPackages}
          groups={YOGA_GROUPS}
          groupCopy={GROUP_COPY}
          phone={phone}
          featureBestValue
          footnote="We'll confirm your batch timings with you on WhatsApp after you book."
        >
          {sessionPolicy && (
            <div className="mx-auto mt-10 max-w-3xl rounded-card border border-border bg-surface-2 p-6 sm:p-8">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Session policy
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cancellations, rescheduling and refunds.
              </p>
              <MarkdownContent
                markdown={sessionPolicy}
                headingOffset={3}
                className="mt-4 text-sm"
              />
            </div>
          )}
          <p className="mt-8 text-center leading-relaxed text-foreground">
            Not sure which to choose?{" "}
            {whatsappUrl ? (
              <TrackedExternalLink
                event="booking_cta_click"
                eventProps={{ intent: "yoga", via: "whatsapp" }}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-accent-text underline-offset-4 hover:underline"
              >
                Ask us on WhatsApp
              </TrackedExternalLink>
            ) : (
              <TrackedLink
                event="booking_cta_click"
                eventProps={{ intent: "yoga", via: "contact_form" }}
                href={`/contact?service=${ENQUIRY_SERVICE_SLUGS.yoga}`}
                className="font-bold text-accent-text underline-offset-4 hover:underline"
              >
                Ask us
              </TrackedLink>
            )}{" "}
            — or read the{" "}
            <Link
              href="/faq"
              className="font-bold text-accent-text underline-offset-4 hover:underline"
            >
              FAQs
            </Link>
            .
          </p>
        </PackagePricing>

        <ServiceFaqs heading="Sessions & booking" faqs={faqs} />

        <FreeGuideCallout
          slugs={["prenatal-yoga-starter-guide", "pregnancy-wellness-guide"]}
          source="yoga"
        />

        <SafetyNote>
          Our yoga sessions are wellness and fitness support — they do not replace
          medical care. If you have a high-risk pregnancy or any specific medical
          condition, please speak to your doctor before joining a class, and let
          us know anything we should work around.
        </SafetyNote>

        <ClosingCta
          title="Not sure which session fits?"
          body="Tell us your stage and what you're hoping for, and we'll point you to the right class."
          decorations={[
            {
              src: "/images/yoga/prenatal-yoga.webp",
              className: "left-8 top-8 w-60",
            },
            {
              src: "/images/yoga/live-group-yoga.webp",
              className: "right-12 top-8 w-64",
            },
          ]}
        >
          <BookingCta
          intent="yoga"
            label="Talk to us"
            whatsappUrl={whatsappUrl}
            secondary={{ href: "/community", label: "Join the community" }}
          />
        </ClosingCta>
      </Container>
    </>
  );
}
