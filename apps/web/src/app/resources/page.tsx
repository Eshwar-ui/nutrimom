import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { ClosingCta, BookingCta } from "@/components/service-sections";
import { ResourceCard } from "@/components/resource-cards";
import { Reveal } from "@/components/reveal";
import { DecorativeElement } from "@/components/decorative-element";
import { JsonLd } from "@/components/json-ld";
import { bookingWhatsappUrl } from "@/lib/booking";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { FREE_RESOURCES } from "@/lib/resources";

export const metadata = pageMetadata({
  title: "Free Guides for Moms",
  description:
    "Free downloadable guides from The Nurture Moms — pregnancy wellness, prenatal yoga, postpartum nourishment and 20 easy Indian baby & toddler meal ideas.",
  path: "/resources",
});

export default async function ResourcesPage() {
  const whatsappUrl = await bookingWhatsappUrl("community");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free guides", path: "/resources" },
        ])}
      />
      <section className="relative overflow-hidden">
        <DecorativeElement
          src="/images/bg-element-sun-doodle.png"
          className="left-6 top-10 hidden w-20 opacity-80 sm:block"
        />
        <DecorativeElement
          src="/images/bg-element-leaf-sprig.png"
          className="-right-16 bottom-0 hidden w-48 rotate-12 opacity-35 lg:block"
        />
        <Container className="relative py-14 text-center sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Free resources
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Free guides for <span className="ink-underline whitespace-nowrap">every stage</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Simple, practical guides written for Indian moms. Download them, keep
              them on your phone, and share them with a friend who needs one. No
              sign-up needed.
            </p>
          </Reveal>
        </Container>
      </section>

      <Container className="max-w-5xl pb-12 sm:pb-16">
        <ul className="grid gap-8 md:grid-cols-2">
          {FREE_RESOURCES.map((resource, i) => (
            <li key={resource.slug}>
              <ResourceCard resource={resource} index={i} source="resources" />
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          These guides are for general education and everyday support. They
          don&apos;t replace individual care from your doctor, midwife, dietitian or
          another qualified healthcare professional.
        </p>

        <ClosingCta
          title="Want help that fits your stage?"
          body="The guides are a starting point. Come into the community and ask the question you still have."
        >
          <BookingCta
            intent="community"
            label="Join the community"
            whatsappUrl={whatsappUrl}
            secondary={{ href: "/nutrition", label: "Explore nutrition" }}
          />
        </ClosingCta>
      </Container>
    </>
  );
}
