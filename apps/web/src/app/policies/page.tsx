import Link from "next/link";
import { ShieldCheck, Camera, Search, HandHeart, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { legalPages } from "@/components/legal-doc";
import { cn } from "@/lib/utils";

export const metadata = { title: "Marketplace policies" };

const points = [
  {
    icon: HandHeart,
    tint: "bg-blush/60",
    title: "We're a platform, not the seller",
    body: "The Nurture Moms connects buyers and sellers. Each item is owned and described by an individual mom, not by us.",
  },
  {
    icon: Search,
    tint: "bg-sky/60",
    title: "Buyers: check before you buy",
    body: "Review photos and details carefully, and message the seller with any questions before completing a purchase.",
  },
  {
    icon: Camera,
    tint: "bg-sage/60",
    title: "Sellers: keep it genuine",
    body: "Upload real photos of the actual item and describe its condition honestly. Trust is what keeps this community thriving.",
  },
  {
    icon: ShieldCheck,
    tint: "bg-lavender/60",
    title: "Safe, secure payments",
    body: "Pay online through our secure gateway, or arrange cash on pickup where the seller offers it. Verified sellers carry a badge.",
  },
];

const formalDocs = legalPages.filter((p) => p.href !== "/policies");

export default function PoliciesPage() {
  return (
    <Container className="py-12 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">The basics</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
          Marketplace policies
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          A few simple promises that keep our community kind, honest, and safe.
        </p>
      </header>

      <div className="mt-9 grid gap-4 sm:grid-cols-2">
        {points.map((p) => (
          <div
            key={p.title}
            className="flex gap-4 rounded-[1.5rem] border-2 border-border bg-surface p-6 card-shadow transition-transform duration-300 hover:-translate-y-1"
          >
            <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-foreground/70", p.tint)}>
              <p.icon className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">{p.title}</h2>
              <p className="mt-1 leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The fine print — into the formal legal docs */}
      <section className="mt-12">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-accent-text">The fine print</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {formalDocs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2/60 px-5 py-4 font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-surface"
            >
              {doc.label}
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
