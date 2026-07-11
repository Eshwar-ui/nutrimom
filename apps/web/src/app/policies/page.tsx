import { ShieldCheck, Camera, Search, HandHeart } from "lucide-react";
import { Container, Card } from "@/components/ui/primitives";

export const metadata = { title: "Marketplace policies" };

const points = [
  {
    icon: HandHeart,
    title: "We're a platform, not the seller",
    body: "The Nurture Moms connects buyers and sellers. Each item is owned and described by an individual mom, not by us.",
  },
  {
    icon: Search,
    title: "Buyers: check before you buy",
    body: "Review photos and details carefully, and message the seller with any questions before completing a purchase.",
  },
  {
    icon: Camera,
    title: "Sellers: keep it genuine",
    body: "Upload real photos of the actual item and describe its condition honestly. Trust is what keeps this community thriving.",
  },
  {
    icon: ShieldCheck,
    title: "Safe, secure payments",
    body: "Pay online through our secure gateway, or arrange cash on pickup where the seller offers it. Verified sellers carry a badge.",
  },
];

export default function PoliciesPage() {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">
        Marketplace policies
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        A few simple promises that keep our community kind, honest, and safe.
      </p>

      <div className="mt-8 space-y-4">
        {points.map((p) => (
          <Card key={p.title} className="flex gap-4 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <p.icon className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">{p.title}</h2>
              <p className="mt-1 leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
