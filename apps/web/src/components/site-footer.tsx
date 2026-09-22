import Link from "next/link";
import { FullLogo } from "./logo";
import { Container } from "./ui/primitives";
import { cn } from "@/lib/utils";
import { BRAND_LINE, FOOTER_COLUMNS, LEGAL_LINKS } from "@/lib/site-nav";

export function SiteFooter() {
  return (
    <footer className="mt-24 overflow-hidden border-t border-border bg-surface/70">
      <div
        className="bg-cover bg-[position:center_bottom] bg-no-repeat"
        style={{ backgroundImage: "url('/images/footer-playful-marketplace.png')" }}
      >
        <Container className="py-14 pb-52 md:pb-44">
          <div className="mx-auto grid max-w-5xl justify-items-center gap-10 text-center md:grid-cols-4">
            <div className="flex flex-col items-center">
              <FullLogo className="max-w-[190px]" />
              <p className="mt-3 text-sm font-semibold text-foreground">{BRAND_LINE}</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Yoga, nutrition, mom support and preloved essentials — brought
                together for moms from pregnancy to toddlerhood.
              </p>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <FooterCol key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
        </Container>
      </div>
      <div className="border-t border-border bg-surface-2">
        <Container className="flex flex-col items-center justify-between gap-3 py-3 text-center text-xs text-muted-foreground sm:flex-row">
          <p>(c) {new Date().getFullYear()} The Nurture Moms. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  className,
}: {
  title: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-accent">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
