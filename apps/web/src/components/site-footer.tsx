import Link from "next/link";
import { CalendarHeart, Instagram, MessageCircle, Youtube } from "lucide-react";
import { FullLogo } from "./logo";
import { MakerHeart } from "./maker-heart";
import { Container } from "./ui/primitives";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  BOOK_SESSION_HREF,
  FOOTER_COLUMNS,
  LEGAL_LINKS,
  type NavLink,
  type SocialLinks,
} from "@/lib/site-nav";

/**
 * The site footer. `social` comes from the root layout, which resolves the
 * admin-edited SiteContent links against the constants in site-nav — so a
 * changed Instagram handle or WhatsApp invite reaches every page's footer on
 * the next admin save, and a failed fetch still leaves working links.
 */
export function SiteFooter({ social }: { social: SocialLinks }) {
  const socialLinks: NavLink[] = [
    { href: social.instagram, label: "Instagram", external: true },
    { href: social.youtube, label: "YouTube", external: true },
    { href: social.whatsappCommunity, label: "WhatsApp community", external: true },
  ];

  return (
    <footer className="mt-24 border-t border-border bg-surface-2">
      <Container className="py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <FullLogo className="max-w-[190px]" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Yoga &amp; Garbhasanskar, maternal and child nutrition, a mom
              community and preloved essentials — support for every stage of
              motherhood, from pregnancy to toddlerhood.
            </p>
            <Link
              href={BOOK_SESSION_HREF}
              className={cn(buttonVariants({ size: "md" }), "mt-6 gap-1.5")}
            >
              <CalendarHeart className="h-4 w-4" aria-hidden /> Book a Session
            </Link>
            <ul className="mt-6 flex items-center gap-2" aria-label="Follow The Nurture Moms">
              <SocialIcon href={social.instagram} label="Instagram">
                <Instagram className="h-5 w-5" aria-hidden />
              </SocialIcon>
              <SocialIcon href={social.youtube} label="YouTube">
                <Youtube className="h-5 w-5" aria-hidden />
              </SocialIcon>
              <SocialIcon href={social.whatsappCommunity} label="WhatsApp community">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </SocialIcon>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <FooterCol key={col.title} title={col.title} links={col.links} />
            ))}
            <FooterCol title="Follow us" links={socialLinks} />
          </div>
        </div>
      </Container>
      <div className="border-t border-border bg-background/60">
        <Container className="flex flex-col items-center justify-between gap-3 py-3 text-center text-xs text-muted-foreground lg:flex-row">
          <p>© {new Date().getFullYear()} The Nurture Moms. All rights reserved.</p>
          <div className="flex items-center">
            <span>Made with</span>
            <MakerHeart />
            <a href="https://asaninnovators.com" className="hover:text-foreground">
              Asan Innovators
            </a>
          </div>
          <nav aria-label="Policies" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex min-h-8 items-center hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (opens in a new tab)`}
        className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        {children}
      </a>
    </li>
  );
}

function FooterCol({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {/* Each link is a 32px row so it is a comfortable thumb target on a
          phone. */}
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
                className="inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors hover:text-accent-text"
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors hover:text-accent-text">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
