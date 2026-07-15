"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User, Tag, Package, Heart, Bell, BadgeCheck, LogOut } from "lucide-react";
import type { Notification } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useRequireAuth } from "@/lib/use-auth";
import { Container } from "@/components/ui/primitives";
import { PageSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/account", label: "Profile", icon: User, exact: true },
  { href: "/account/listings", label: "My listings", icon: Tag },
  { href: "/account/membership", label: "Membership", icon: BadgeCheck },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

/**
 * Shared dashboard shell for the buyer/seller account area. Rendered by
 * account/layout.tsx for /account/* and reused directly by /wishlist (which
 * lives outside the route subtree) so both share one sidebar + identity card.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const { ready, user } = useRequireAuth();
  const pathname = usePathname();

  // Reuses the header's cached query, so no extra request just for the badge.
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => authedRequest<Notification[]>("/notifications"),
    enabled: !!user,
  });
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  if (!ready || !user) {
    return <Container className="py-12"><PageSkeleton rows={4} /></Container>;
  }

  const links = (mobile: boolean) =>
    nav.map((item) => {
      const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
            active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            !mobile && "w-full",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
          {item.href === "/account/notifications" && unread > 0 && (
            <span
              className={cn(
                "ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold",
                active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-accent text-accent-foreground",
              )}
            >
              {unread}
            </span>
          )}
        </Link>
      );
    });

  const logout = useAuthStore.getState().logout;

  return (
    <Container className="py-8 sm:py-10">
      {/* Mobile: scrollable tab bar */}
      <div className="mb-6 overflow-x-auto border-b border-border pb-3 lg:hidden">
        <nav aria-label="Account sections" className="flex min-w-max gap-2">{links(true)}</nav>
      </div>

      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-32 space-y-5">
            <div className="rounded-2xl border border-border bg-surface p-4 card-shadow">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/12 text-lg font-bold text-primary">
                  {user.name[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate font-semibold text-foreground">
                    {user.name}
                    {user.isSellerVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <nav aria-label="Account sections" className="space-y-1">{links(false)}</nav>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </Container>
  );
}
