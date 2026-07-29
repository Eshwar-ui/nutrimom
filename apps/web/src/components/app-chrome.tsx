"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FlyToCart } from "@/components/fly-to-cart";

/**
 * Picks the shell for the current route. The admin panel is a separate product
 * from the storefront: it gets none of the shop chrome (marquee, Shop nav,
 * cart, "Sell an item", marketing footer) and supplies its own header in
 * app/admin/layout.tsx.
 *
 * A pathname check rather than route groups so the shop's URLs stay exactly
 * where they are — moving every page into a group would rewrite the whole app
 * directory for no user-visible gain.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) return <main className="flex-1">{children}</main>;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FlyToCart />
    </>
  );
}
