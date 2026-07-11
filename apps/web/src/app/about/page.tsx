import Link from "next/link";
import { Heart, Leaf, ShieldCheck, Users } from "lucide-react";
import { Container, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About us",
  description: "Why The Nurture Moms exists, and how the marketplace works.",
};

const values = [
  {
    icon: Heart,
    title: "From moms, for moms",
    body: "Every listing comes from a real mother passing on gear her own child has outgrown — not a warehouse.",
  },
  {
    icon: Leaf,
    title: "Kinder to the planet",
    body: "Strollers, cots, and clothes get a second life instead of ending up in landfill after a few months of use.",
  },
  {
    icon: ShieldCheck,
    title: "Trust, built in",
    body: "Condition grading, verified-seller badges, and buyer ratings help you know exactly what you're getting.",
  },
  {
    icon: Users,
    title: "A community, not just a marketplace",
    body: "Parenting gear is expensive for a season you outgrow fast — we help that cost circulate, not disappear.",
  },
];

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">About The Nurture Moms</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        A trusted marketplace where mothers buy, sell, and donate gently used
        baby and maternity essentials — because the best gear is the gear
        that's already loved.
      </p>

      <p className="mt-6 leading-relaxed text-muted-foreground">
        Baby gear has a short shelf life and a long price tag. A stroller gets
        outgrown in a year; a maternity wardrobe, in a few months. We started
        The Nurture Moms so that value doesn't just vanish into a garage — it
        passes to the next family who needs it, at a price that makes sense.
      </p>

      <div className="mt-8 space-y-4">
        {values.map((v) => (
          <Card key={v.title} className="flex gap-4 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <v.icon className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">{v.title}</h2>
              <p className="mt-1 leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/listings"><Button>Shop preloved</Button></Link>
        <Link href="/sell"><Button variant="outline">Sell an item</Button></Link>
        <Link href="/contact"><Button variant="ghost">Get in touch</Button></Link>
      </div>
    </Container>
  );
}
