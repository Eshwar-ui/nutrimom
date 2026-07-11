import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";

export function Newsletter() {
  return (
    <Container className="py-14 sm:py-20">
      <section className="relative mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] border border-border-control/40 bg-surface card-shadow md:grid-cols-[0.7fr_1.3fr]">
        <div className="grid min-h-48 place-items-center bg-gold/75 p-8 text-[#4c350d]">
          <ShieldCheck className="h-14 w-14" strokeWidth={1.4} aria-hidden />
          <p className="mt-3 max-w-[18ch] text-center font-display text-2xl font-semibold leading-tight">Buy with the right questions</p>
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <h2 className="font-display text-3xl font-semibold text-foreground">Check the item, seller and handover details</h2>
          <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">Our marketplace guide explains what buyers should confirm and what sellers must disclose before money changes hands.</p>
          <div className="mt-6">
            <Link href="/policies" className={buttonVariants({ variant: "outline" })}>Read marketplace policies <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
