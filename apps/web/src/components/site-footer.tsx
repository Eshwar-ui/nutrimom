import Link from "next/link";
import { FullLogo } from "./logo";
import { MakerHeart } from "./maker-heart";
import { Container } from "./ui/primitives";
import { cn } from "@/lib/utils";
import { FOOTER_COLUMNS, LEGAL_LINKS, type NavLink } from "@/lib/site-nav";

export function SiteFooter() {
  const [explore, marketplace, yourSpace, socials] = FOOTER_COLUMNS;

  return (
    <footer className="mt-24 overflow-hidden border-t border-border bg-surface/70">
      <div
        className="bg-cover bg-[position:center_bottom] bg-no-repeat"
        style={{ backgroundImage: "url('/images/footer-playful-marketplace.png')" }}
      >
        <Container className="py-14 pb-52 md:pb-44">
          <div className="mx-auto grid max-w-4xl items-start gap-12 text-center md:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] md:gap-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:gap-x-8">
              <FooterCol title={explore.title} links={explore.links} className="md:text-left" />
              <FooterCol title={marketplace.title} links={marketplace.links} className="md:text-left" />
            </div>
            <div className="order-first flex w-full flex-col items-center text-center md:order-none">
              <FullLogo className="max-w-[210px]" />
              <p className="mt-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
                A trusted marketplace where mothers buy, sell, and donate gently
                used baby and maternity treasures. Loved before, loved again.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:gap-x-8">
              <FooterCol title={yourSpace.title} links={yourSpace.links} className="md:text-left" />
              <FooterCol title={socials.title} links={socials.links} className="md:text-left" />
            </div>
          </div>
        </Container>
      </div>
      <div className="border-t border-border bg-surface-2">
        <Container className="flex flex-col items-center justify-between gap-3 py-3 text-center text-xs text-muted-foreground sm:flex-row">
          <p>(c) {new Date().getFullYear()} The Nurture Moms. All rights reserved.</p>
          <div className="flex items-center">
            <span>Made with</span>
            <MakerHeart />
            <a href="https://asaninnovators.com" className="hover:text-foreground">
              Asan Innovators
            </a>
          </div>
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
  links: NavLink[];
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      {/* Each link is a 32px row so it is a comfortable thumb target on a
          phone; the rows replace the old 8px gaps, so the column reads the same. */}
      <ul className="space-y-0.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            {l.placeholder ? (
              <span className="inline-flex min-h-8 items-center text-sm text-muted-foreground/70">{l.label}</span>
            ) : l.external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors hover:text-accent">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
