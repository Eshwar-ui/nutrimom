import Link from "next/link";
import { ArrowRight, ShieldCheck, Camera, UserCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Playful } from "@/components/ui/playful";
import { DecorativeElement } from "@/components/decorative-element";
import { PlayfulBackground } from "@/components/playful-background";

const checks = [
  {
    icon: Camera,
    tint: "bg-blush/60 text-[#7a2447]",
    title: "Item & photos",
    body: "Condition grade, real photos and every included accessory.",
    rotate: "-rotate-2",
    lift: "",
  },
  {
    icon: UserCheck,
    tint: "bg-sky/70 text-[#215172]",
    title: "Seller & reviews",
    body: "Profile, listing history and feedback from other moms.",
    rotate: "rotate-1",
    lift: "sm:mt-5",
  },
  {
    icon: Truck,
    tint: "bg-sage/70 text-[#2f5236]",
    title: "Handover plan",
    body: "Pickup or delivery, timing and safety before you pay.",
    rotate: "-rotate-1",
    lift: "",
  },
];

export function Newsletter() {
  return (
    <section className="relative isolate overflow-hidden">
      <PlayfulBackground variant="fresh" className="opacity-80" />
      <DecorativeElement src="/images/bg-element-dotted-trail.png" className="-left-32 bottom-0 hidden w-80 opacity-20 xl:block" />
      <DecorativeElement src="/images/bg-element-toy-accent.png" className="right-[8%] bottom-8 hidden w-20 rotate-6 opacity-25 md:block" />
      <DecorativeElement src="/images/bg-element-leaf-sprig.png" className="-right-10 bottom-6 hidden w-40 rotate-12 opacity-30 lg:block" />
      <Container className="relative z-[1] py-14 sm:py-20">
        <Reveal>
          <div className="relative mx-auto max-w-4xl rotate-[-0.5deg] rounded-[2rem] border-2 border-border bg-cream px-6 py-10 card-shadow sm:px-12 sm:py-12">
            {/* washi tape pinning the note */}
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-3 rounded-[4px] border border-white/50 bg-surface/70 shadow-sm backdrop-blur-sm" />
            {/* corner shield sticker */}
            <span aria-hidden className="absolute -right-3 -top-3 grid h-14 w-14 rotate-6 place-items-center rounded-full border-2 border-surface bg-gold text-[#5c4410] shadow-md">
              <ShieldCheck className="h-7 w-7" strokeWidth={1.6} />
            </span>

            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Buy with confidence</p>
              <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Buy with the{" "}
                <span className="ink-underline whitespace-nowrap">right questions</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
                Our marketplace guide explains what buyers should confirm and what sellers must disclose before money changes hands.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {checks.map((c, i) => (
                <Reveal key={c.title} delay={i * 0.08} className={c.lift}>
                  <div className={`group relative flex h-full flex-col rounded-2xl border-2 border-border bg-surface p-5 card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${c.rotate} hover:-translate-y-1.5 hover:rotate-0`}>
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-110 ${c.tint}`}>
                      <c.icon className="h-6 w-6" strokeWidth={1.7} />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-9 flex justify-center">
              <Playful>
                <Link href="/policies" className={buttonVariants({ size: "lg" })}>
                  Read marketplace policies <ArrowRight className="h-4 w-4" />
                </Link>
              </Playful>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
