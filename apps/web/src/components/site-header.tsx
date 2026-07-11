"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  User,
  LayoutDashboard,
  LogOut,
  Tag,
  Search,
  X,
  Bell,
  Menu,
  ChevronDown,
} from "lucide-react";
import type { Notification } from "@nutrimom/shared";
import { Logo, LogoEmblem } from "./logo";
import { Button, buttonVariants } from "./ui/button";
import { useCartStore, cartCount } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { authedRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthHydrated } from "@/lib/use-store-hydrated";

// Shop dropdown — "Shop all" plus a curated set of category shortcuts.
const shopLinks = [
  { href: "/listings", label: "Shop all" },
  { href: "/categories/strollers", label: "Strollers" },
  { href: "/categories/baby-clothes", label: "Baby Clothes" },
  { href: "/categories/maternity-wear", label: "Maternity Wear" },
  { href: "/categories/toys", label: "Toys" },
];

const pageLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const ticker = [
  "Preloved gear from local families",
  "Condition and seller details up front",
  "Server-verified prices at checkout",
  "Buy, sell or pass it on",
];

export function SiteHeader() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCartStore(cartCount);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const wishCount = useWishlistStore((s) => s.ids.length);
  const loadWish = useWishlistStore((s) => s.load);
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => authedRequest<Notification[]>("/notifications"),
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    if (user) loadWish();
  }, [user, loadWish]);
  // Transparent over the hero at the top; frosted-solid once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, menuOpen]);

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q =
      new FormData(e.currentTarget).get("search")?.toString().trim() ?? "";
    setSearchOpen(false);
    router.push(q ? `/listings?search=${encodeURIComponent(q)}` : "/listings");
  };

  return (
    <div className="sticky top-0 z-40">
      <div className="overflow-hidden border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="flex w-max animate-[marquee_36s_linear_infinite] gap-10 py-2 pr-10 hover:[animation-play-state:paused]">
          {[...ticker, ...ticker, ...ticker, ...ticker].map((t, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap text-xs font-medium tracking-wide">
              {t}
              <span className="h-1 w-1 rounded-full bg-primary-foreground/50" />
            </span>
          ))}
        </div>
      </div>

      <header
        className={cn(
          "border-b transition-colors duration-300",
          scrolled || menuOpen
            ? "border-border/60 bg-background/80 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-5 sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="shrink-0 lg:hidden"
            onClick={() => {
              setMenuOpen((o) => !o);
              setSearchOpen(false);
            }}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href="/" aria-label="The Nurture Moms home" className="shrink-0 sm:hidden"><LogoEmblem badgeClassName="h-9 w-9" /></Link>
          <Logo className="hidden shrink-0 sm:inline-flex" />

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {/* Shop — links to the catalog, reveals category shortcuts on
                hover or keyboard focus (focus-within keeps it accessible). */}
            <div className="group relative">
              <Link
                href="/listings"
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Shop
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </Link>
              <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-2xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]">
                  {shopLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {pageLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((o) => !o);
                setMenuOpen(false);
              }}
            >
              <Search className="h-5 w-5" />
            </Button>

            {hydrated && user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link href="/admin" aria-label="Admin" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "hidden sm:inline-flex")}>
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                )}
                <Link href="/account" aria-label="My account" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">{user.name.split(" ")[0]}</span>
                </Link>
                <Link href="/account/notifications" aria-label="Notifications" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Log out"
                  className="hidden sm:inline-flex"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>

                {/* Wishlist + cart — only once signed in */}
                <Link href="/wishlist" aria-label="Wishlist" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative hidden sm:inline-flex")}>
                  <Heart className="h-5 w-5" />
                  {wishCount > 0 && (
                    <motion.span
                      key={wishCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 600, damping: 14 }}
                      className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
                    >
                      {wishCount}
                    </motion.span>
                  )}
                </Link>
                <Link href="/cart" aria-label="Cart" data-fly-cart-target className={cn(buttonVariants({ variant: "accent", size: "icon" }), "relative")}>
                  <ShoppingBag className="h-5 w-5" />
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 600, damping: 14 }}
                      className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-background"
                    >
                      {count}
                    </motion.span>
                  )}
                </Link>

                {/* Secondary CTA */}
                <Link href="/sell" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-1 hidden gap-1.5 sm:inline-flex")}>
                  <Tag className="h-4 w-4" /> Sell an item
                </Link>
              </>
            ) : (
              <>
                {/* Secondary CTA */}
                <Link href="/sell" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden gap-1.5 sm:inline-flex")}>
                  <Tag className="h-4 w-4" /> Sell an item
                </Link>
                {/* Primary CTA */}
                <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "ml-1 gap-1.5")}>
                  <User className="h-4 w-4" /> Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background/95 backdrop-blur-xl shadow-[0_12px_30px_-18px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-5 py-3 sm:px-8">
            <form onSubmit={submitSearch} role="search" className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                name="search"
                placeholder="Search preloved strollers, clothes, toys…"
                aria-label="Search listings"
                className="h-12 w-full rounded-full border-2 border-border bg-surface pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </form>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full overflow-hidden border-b border-border bg-background/95 backdrop-blur-xl shadow-[0_12px_30px_-18px_rgba(0,0,0,0.35)] lg:hidden"
          >
            <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-5 py-4 sm:px-8">
              <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Shop</p>
              {shopLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
              {pageLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
              {hydrated && user && (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  {user.role === "ADMIN" && <Link href="/admin" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Admin</Link>}
                  <Link href="/account/notifications" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Notifications</Link>
                  <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">Wishlist</Link>
                  <button type="button" onClick={() => { logout(); setMenuOpen(false); }} className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-danger hover:bg-danger/10">Log out</button>
                </div>
              )}
              <Link href="/sell" onClick={() => setMenuOpen(false)} className={cn(buttonVariants(), "mt-2 w-full gap-1.5")}>
                <Tag className="h-4 w-4" /> Sell an item
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
