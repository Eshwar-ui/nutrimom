import Link from "next/link";
import {
  AlertTriangle,
  MessageCircle,
  PackageSearch,
  Store,
  ArrowRight,
  Sparkles,
  Mail,
} from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Playful } from "@/components/ui/playful";
import { DecorativeElement } from "@/components/decorative-element";
import { LegalPlaceholderBanner } from "@/components/legal-placeholder-banner";
import { ContactForm } from "@/components/contact-form";

export const metadata = { title: "Contact us", robots: { index: false, follow: false } };

const details = [
  {
    icon: PackageSearch,
    label: "Order support",
    body: "Open My orders and include the order number when asking for help.",
    href: "/account/orders",
    cta: "Open My orders",
    paper: "bg-blush/45",
    sticker: "bg-blush text-[#7a2447]",
    rotate: "-rotate-2",
    tape: "left-8 -rotate-6",
    lift: "sm:mt-6",
  },
  {
    icon: MessageCircle,
    label: "Listing questions",
    body: "Use the seller's WhatsApp action on the listing for item and handover questions.",
    paper: "bg-sky/50",
    sticker: "bg-sky text-[#215172]",
    rotate: "rotate-1",
    tape: "right-10 rotate-3",
    lift: "",
  },
  {
    icon: AlertTriangle,
    label: "Payment safety",
    body: "Use marketplace checkout for online payments. Never share card or OTP details with a seller.",
    paper: "bg-sage/45",
    sticker: "bg-sage text-[#2f5236]",
    rotate: "rotate-1",
    tape: "left-10 -rotate-3",
    lift: "sm:mt-6",
  },
  {
    icon: Store,
    label: "Business information",
    body: "Operator and registered contact details will be published here before public launch.",
    paper: "bg-lavender/50",
    sticker: "bg-lavender text-[#4a3170]",
    rotate: "-rotate-1",
    tape: "right-8 rotate-6",
    lift: "",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-sun-doodle.png" className="left-6 top-10 hidden w-20 opacity-80 sm:block" />
        <DecorativeElement src="/images/bg-element-doodle-cluster.png" className="right-8 top-14 hidden w-28 -rotate-12 opacity-60 md:block" />
        <DecorativeElement src="/images/bg-element-leaf-sprig.png" className="-left-16 bottom-0 hidden w-44 -rotate-12 opacity-35 lg:block" />
        <Container className="relative py-14 text-center sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Help &amp; safety
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              We&apos;re here to{" "}
              <span className="ink-underline whitespace-nowrap">help you out</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Find the right path for an order, a listing, or a marketplace safety question — and reach a real person when you need one.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Contact form — the primary way to reach us */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-blush-swash.png" className="-left-40 top-8 hidden w-[30rem] opacity-20 lg:block" />
        <Container className="relative max-w-4xl pb-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-border bg-surface card-shadow md:grid md:grid-cols-[0.8fr_1.2fr]">
              <div className="relative flex flex-col justify-center gap-4 bg-primary p-8 text-primary-foreground sm:p-10">
                <DecorativeElement src="/images/bg-element-toy-accent.png" className="right-4 top-4 hidden w-20 opacity-40 md:block" />
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/15">
                  <Mail className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <h2 className="font-display text-3xl font-semibold leading-tight">Send us a message</h2>
                <p className="max-w-xs leading-relaxed text-primary-foreground/80">
                  Questions about an order, a listing, or selling on the marketplace? Drop us a note and we&apos;ll get back to you.
                </p>
              </div>
              <ContactForm />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Contact routes — scrapbook cards */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-dotted-trail.png" className="-right-24 top-8 hidden w-[26rem] opacity-30 xl:block" />
        <DecorativeElement src="/images/bg-element-peach-onesie.png" className="-left-8 bottom-8 hidden w-28 -rotate-6 opacity-35 lg:block" />
        <Container className="relative max-w-4xl pb-16">
          <Reveal>
            <LegalPlaceholderBanner />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            {details.map((d, i) => (
              <Reveal key={d.label} delay={i * 0.08} className={d.lift}>
                <div
                  className={`group relative flex h-full flex-col rounded-[1.75rem] border-2 border-border ${d.paper} p-6 card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${d.rotate} hover:-translate-y-1.5 hover:rotate-0 sm:p-7`}
                >
                  <span aria-hidden className={`absolute -top-3 h-6 w-20 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm ${d.tape}`} />
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-surface transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-110 ${d.sticker}`}>
                    <d.icon className="h-6 w-6" strokeWidth={1.7} />
                  </span>
                  <h2 className="mt-5 font-display text-xl font-semibold text-foreground">{d.label}</h2>
                  <p className="mt-1.5 flex-1 leading-relaxed text-muted-foreground">{d.body}</p>
                  {d.href && (
                    <Link href={d.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent-text hover:underline">
                      {d.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <DecorativeElement src="/images/bg-element-blush-swash.png" className="-left-40 -top-20 w-[34rem] opacity-20" />
        <DecorativeElement src="/images/bg-element-toy-accent.png" className="right-8 top-6 hidden w-24 opacity-60 sm:block" />
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <Container className="relative flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-primary-foreground sm:text-4xl">
            While you&apos;re here — find your next treasure.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Playful>
              <Link href="/listings" className={buttonVariants({ variant: "gold", size: "lg" })}>
                Shop preloved <ArrowRight className="h-4 w-4" />
              </Link>
            </Playful>
            <Playful>
              <Link href="/about" className="inline-flex h-14 items-center gap-1.5 rounded-full border border-primary-foreground/40 px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                About us
              </Link>
            </Playful>
          </div>
        </Container>
      </section>
    </>
  );
}
