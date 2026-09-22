import { Container } from "@/components/ui/primitives";
import {
  ServiceHero,
  IncludesList,
  BookingCta,
  ClosingCta,
} from "@/components/service-sections";
import { bookingWhatsappUrl } from "@/lib/booking";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mom Support Community",
  description:
    "A free community for Indian moms — pregnancy and postpartum support, baby and toddler talk, nutrition resources, mom wellness, mompreneur conversations and expert sessions.",
  path: "/community",
});

const areas = [
  "Pregnancy support and conversations.",
  "Postpartum support and everyday motherhood.",
  "Baby and toddler discussions.",
  "Food, nutrition and practical resources.",
  "Mom wellness and self-care.",
  "Mompreneur conversations and networking.",
  "Expert sessions, workshops and live events.",
];

export default async function CommunityPage() {
  const whatsappUrl = await bookingWhatsappUrl("community");

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <ServiceHero
        eyebrow="Connect"
        title="Find your village"
        subtitle="Motherhood can be beautiful, overwhelming, confusing and everything in between. You don't have to figure it all out alone."
      >
        <BookingCta
          label="Join the community"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/journal", label: "Read the Journal" }}
        />
      </ServiceHero>

      <IncludesList heading="What we talk about" items={areas} />

      <section className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Free to join
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          The community is free, and we&apos;d like it to stay easy to join and easy
          to share with a friend who needs it. There&apos;s no membership to buy and
          nothing to unlock before you can ask your first question.
        </p>
        {/*
          The founders' brief describes an optional paid tier ("Nurture Moms
          Plus", ₹99–₹199/month) and then says explicitly: do not launch it
          until the benefits and the delivery schedule are clear. So it is
          named as something coming, not sold — a page that takes money for a
          schedule nobody has written is how a community loses its trust.
        */}
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We&apos;re working on an optional paid layer with exclusive workshops, a
          resource library and member events. It isn&apos;t open yet — when it is,
          you&apos;ll hear about it inside the community first.
        </p>
      </section>

      <ClosingCta
        title="You're not meant to do motherhood alone"
        body="Come in, say hello, and ask the question you've been searching the internet for."
      >
        <BookingCta
          label="Join the community"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/about", label: "Meet the founders" }}
        />
      </ClosingCta>
    </Container>
  );
}
