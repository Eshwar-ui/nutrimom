import Link from "next/link";
import { FullLogo } from "./logo";
import { Container } from "./ui/primitives";

export function SiteFooter() {
  return (
    <footer className="mt-24 overflow-hidden border-t border-border bg-surface/70">
      <div
        className="bg-cover bg-[position:center_bottom] bg-no-repeat"
        style={{ backgroundImage: "url('/images/footer-playful-marketplace.png')" }}
      >
        <Container className="py-14 pb-52 md:pb-44">
          <div className="mx-auto grid max-w-4xl justify-items-center gap-10 text-center md:grid-cols-3">
          <FooterCol
              title="Explore"
              links={[
                { href: "/listings", label: "Shop all" },
                { href: "/categories/strollers", label: "Strollers" },
                { href: "/categories/maternity-wear", label: "Maternity" },
                { href: "/sell", label: "Sell an item" },
              ]}
            />
            <div className="flex flex-col items-center">
              <FullLogo className="max-w-[190px]" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                A trusted marketplace where mothers buy, sell, and donate gently
                used baby and maternity treasures. Loved before, loved again.
              </p>
            </div>
            
            <FooterCol
              title="Your space"
              links={[
                { href: "/account", label: "My account" },
                { href: "/account/listings", label: "My listings" },
                { href: "/wishlist", label: "Wishlist" },
                { href: "/contact", label: "Contact us" },
              ]}
            />
          </div>
        </Container>
      </div>
      <div className="border-t border-border bg-surface-2">
        <Container className="flex flex-col items-center justify-between gap-3 py-3 text-center text-xs text-muted-foreground sm:flex-row">
          <p>(c) {new Date().getFullYear()} The Nurture Moms. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/policies" className="hover:text-foreground">Policies</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/refunds" className="hover:text-foreground">Refunds</Link>
          </nav>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="text-center">
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
