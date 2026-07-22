"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { SearchOverlay } from "./search-overlay";
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
  "Secure checkout, every time",
  "Buy, sell or pass it on",
];

export function SiteHeader() {
  const hydrated = useAuthHydrated();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hover intent: open instantly, close on a short delay so crossing into the
  // panel (or a brief mouse-out) doesn't dismiss it. Click/keyboard still work.
  const openAccount = () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    setAccountOpen(true);
  };
  const scheduleCloseAccount = () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    accountCloseTimer.current = setTimeout(() => setAccountOpen(false), 140);
  };
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
    if (!searchOpen && !menuOpen && !accountOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, menuOpen, accountOpen]);
  // Close the account dropdown when clicking anywhere outside it.
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [accountOpen]);
  // Clear any pending hover-close timer on unmount.
  useEffect(() => () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
  }, []);

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
                {/* Cart — accent, always visible */}
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

                {/* Primary sell CTA */}
                <Link href="/sell" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-1 hidden gap-1.5 sm:inline-flex")}>
                  <Tag className="h-4 w-4" /> Sell an item
                </Link>

                {/* Profile — avatar chip that reveals wishlist, notifications & sign out on hover/click */}
                <div
                  ref={accountRef}
                  className="relative ml-1.5"
                  onMouseEnter={openAccount}
                  onMouseLeave={scheduleCloseAccount}
                >
                  <button
                    type="button"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    onClick={() => { setAccountOpen((o) => !o); setSearchOpen(false); }}
                    className={cn(
                      "group flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 transition-[transform,background-color,border-color] duration-200 active:scale-[0.97]",
                      accountOpen
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-surface/70 backdrop-blur-sm hover:border-primary/40 hover:bg-surface",
                    )}
                  >
                    <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold uppercase text-primary">
                      {user.name[0]}
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
                      )}
                    </span>
                    <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-foreground lg:inline">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", accountOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformOrigin: "top right" }}
                        className="absolute right-0 top-full z-50 w-60 pt-2"
                      >
                       <div className="rounded-2xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center gap-3 border-b border-border px-3 py-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-bold uppercase text-primary">
                            {user.name[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="pt-1.5">
                          <Link role="menuitem" href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" /> My account
                          </Link>
                          <Link role="menuitem" href="/wishlist" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                            <Heart className="h-4 w-4 text-muted-foreground" /> Wishlist
                            {wishCount > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-muted-foreground">{wishCount}</span>}
                          </Link>
                          <Link role="menuitem" href="/account/notifications" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                            <Bell className="h-4 w-4 text-muted-foreground" /> Notifications
                            {unreadCount > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">{unreadCount}</span>}
                          </Link>
                          {user.role === "ADMIN" && (
                            <Link role="menuitem" href="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                              <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Admin
                            </Link>
                          )}
                        </div>
                        <div className="mt-1.5 border-t border-border pt-1.5">
                          <button role="menuitem" type="button" onClick={() => { logout(); setAccountOpen(false); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10">
                            <LogOut className="h-4 w-4" /> Log out
                          </button>
                        </div>
                       </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
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
