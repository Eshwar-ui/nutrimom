import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import {
  IncludesList,
  BookingCta,
  ClosingCta,
} from "@/components/service-sections";
import { Reveal } from "@/components/reveal";
import { DecorativeElement } from "@/components/decorative-element";
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
    <>
      <section className="relative overflow-hidden">
        <DecorativeElement
          src="/images/bg-element-sun-doodle.png"
          className="left-6 top-10 hidden w-20 opacity-80 sm:block"
        />
        <DecorativeElement
          src="/images/bg-element-leaf-sprig.png"
          className="-left-16 bottom-0 hidden w-48 -rotate-12 opacity-35 lg:block"
        />
        <DecorativeElement
          src="/images/bg-element-doodle-cluster.png"
          className="right-6 top-16 hidden w-28 rotate-6 opacity-60 md:block"
        />
        <DecorativeElement
          src="/images/bg-element-toy-accent.png"
          className="-right-8 bottom-2 hidden w-28 rotate-6 opacity-40 lg:block"
        />
        <Container className="relative py-14 text-center sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> A circle for mothers
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Find your <span className="ink-underline whitespace-nowrap">village</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Motherhood can be beautiful, overwhelming, confusing and everything in between. You don&apos;t have to figure it all out alone.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <BookingCta
          intent="community"
                label="Join the community"
                whatsappUrl={whatsappUrl}
                secondary={{ href: "/journal", label: "Read the Journal" }}
              />
            </div>
          </Reveal>
        </Container>
      </section>

      <Container className="max-w-4xl py-12 sm:py-16">

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
          intent="community"
          label="Join the community"
          whatsappUrl={whatsappUrl}
          secondary={{ href: "/about", label: "Meet the founders" }}
        />
      </ClosingCta>
      </Container>
    </>
  );
}
