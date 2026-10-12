"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { LogoEmblem } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Top bar for the admin panel. Deliberately minimal — no cart, no shop nav, no
 * marketing marquee — and it owns the only way out: "Visit website" to switch
 * to the storefront, plus the account menu.
 */
export function AdminHeader() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[88rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/admin" aria-label="Admin dashboard" className="flex shrink-0 items-center gap-2.5">
          <LogoEmblem badgeClassName="h-9 w-9" />
          <span className="hidden text-sm font-bold uppercase tracking-[0.16em] text-accent-text sm:block">
            Admin
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Visit website</span>
            <span className="sm:hidden">Website</span>
          </Link>

          {user && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-muted"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/12 text-xs font-bold uppercase text-primary">
                  {user.name[0]}
                </span>
                <span className="hidden max-w-24 truncate text-sm font-semibold text-foreground sm:block">
                  {user.name}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {open && (
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
                        <Link
                          role="menuitem"
                          href="/account"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          <User className="h-4 w-4 text-muted-foreground" /> My account
                        </Link>
                        <Link
                          role="menuitem"
                          href="/"
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground" /> Visit website
                        </Link>
                      </div>
                      <div className="mt-1.5 border-t border-border pt-1.5">
                        <button
                          role="menuitem"
                          type="button"
                          onClick={() => {
                            logout();
                            setOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
                        >
                          <LogOut className="h-4 w-4" /> Log out
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
