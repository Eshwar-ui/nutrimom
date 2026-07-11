import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Container, Card } from "@/components/ui/primitives";
import { LegalPlaceholderBanner } from "@/components/legal-placeholder-banner";

export const metadata = { title: "Contact us" };

const details = [
  { icon: Mail, label: "Email", value: "[SUPPORT EMAIL]", href: "mailto:[SUPPORT EMAIL]" },
  { icon: Phone, label: "Phone", value: "[SUPPORT PHONE]", href: "tel:[SUPPORT PHONE]" },
  { icon: MapPin, label: "Registered address", value: "[LEGAL ENTITY NAME], [REGISTERED ADDRESS]" },
  { icon: Clock, label: "Support hours", value: "[DAYS], [START TIME]–[END TIME] IST" },
];

export default function ContactPage() {
  return (
    <Container className="max-w-2xl py-14">
      <h1 className="font-display text-4xl font-semibold text-foreground">Contact us</h1>
      <p className="mt-2 text-muted-foreground">
        Questions about an order, a listing, or your account — we&apos;re happy to help.
      </p>
      <LegalPlaceholderBanner />

      <div className="space-y-3">
        {details.map((d) => (
          <Card key={d.label} className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <d.icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{d.label}</p>
              {d.href ? (
                <a href={d.href} className="font-medium text-foreground hover:text-accent">{d.value}</a>
              ) : (
                <p className="font-medium text-foreground">{d.value}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        For a specific order, include your order number — find it on{" "}
        <a href="/account/orders" className="text-accent hover:underline">My orders</a>.
      </p>
    </Container>
  );
}
