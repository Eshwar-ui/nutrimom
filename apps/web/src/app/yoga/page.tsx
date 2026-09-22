import { Flower2, HeartPulse, Sparkles, Users, PlayCircle, UserRound } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import {
  ServiceHero,
  CredentialStrip,
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
  title: "Yoga & Garbhasanskar",
  description:
    "Prenatal yoga, postnatal recovery, Garbhasanskar and 1:1 sessions for Indian moms — live group batches and recorded practice, guided through pregnancy and beyond.",
  path: "/yoga",
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
    title: "Prenatal Yoga",
    body: "Trimester-aware movement, breathwork, relaxation and mobility for pregnancy.",
  },
  {
    icon: HeartPulse,
    tint: "bg-sage/60",
    title: "Postnatal Yoga",
    body: "Gentle recovery, mobility, strength and core-focused movement as appropriate.",
  },
  {
    icon: Sparkles,
    tint: "bg-lavender/60",
    title: "Garbhasanskar",
    body: "Breathwork, affirmations, relaxation and mindful pregnancy practices.",
  },
  {
    icon: Users,
    tint: "bg-sky/60",
    title: "Live Group Batches",
    body: "Small-group sessions with live guidance and structured sequencing.",
  },
  {
    icon: PlayCircle,
    tint: "bg-beige",
    title: "Recorded Sessions",
    body: "Practise at a time that suits you, with pregnancy and postpartum resources.",
  },
  {
    icon: UserRound,
    tint: "bg-blush/60",
    title: "1:1 Sessions",
    body: "Personalised sessions for individual goals and needs, with medical clearance where appropriate.",
  },
];

const pricing = [
  { label: "Trial / intro session", price: "from ₹299" },
  { label: "Group class", price: "from ₹199 per class" },
  { label: "Monthly batch", price: "from ₹799" },
  { label: "Garbhasanskar", price: "from ₹499" },
  { label: "1:1 session", price: "from ₹699" },
];

export default async function YogaPage() {
  const whatsappUrl = await bookingWhatsappUrl("yoga");

  return (
    <Container className="py-12 sm:py-16">
      <ServiceHero
        eyebrow="Move"
        title="Yoga for every stage of motherhood"
        subtitle="Move, breathe and reconnect with yourself through pregnancy, postpartum recovery and beyond."
      >
        <BookingCta
          label="View classes & book a session"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/nutrition", label: "Explore Nutrition" }}
        />
      </ServiceHero>

      <CredentialStrip items={credentials} />

      <OfferingGrid heading="What we offer" items={offerings} />

      <PricingTable
        rows={pricing}
        note="Starting prices. Final fees vary by batch, session length and format — we'll confirm before you book."
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
      >
        <BookingCta
          label="Talk to us"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/community", label: "Join the community" }}
        />
      </ClosingCta>
    </Container>
  );
}
