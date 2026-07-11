"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, Users, ClipboardList, Tags } from "lucide-react";
import { useRequireAuth } from "@/lib/use-auth";
import { Container } from "@/components/ui/primitives";
import { PageSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: ClipboardCheck },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth("ADMIN");
  const pathname = usePathname();
  if (!ready) return <Container className="py-12"><PageSkeleton rows={4} /></Container>;

  const nav = (mobile: boolean) => tabs.map((tab) => {
    const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          !mobile && "w-full",
        )}
      >
        <tab.icon className="h-4 w-4" /> {tab.label}
      </Link>
    );
  });

  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-6 overflow-x-auto border-b border-border pb-3 lg:hidden">
        <nav aria-label="Admin sections" className="flex min-w-max gap-2">{nav(true)}</nav>
      </div>
      <div className="grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <p className="mb-4 px-3 text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Admin workspace</p>
            <nav aria-label="Admin sections" className="space-y-1">{nav(false)}</nav>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </Container>
  );
}
