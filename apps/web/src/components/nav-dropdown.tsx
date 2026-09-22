"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { NavLink } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

/**
 * A primary-nav item that reveals a submenu.
 *
 * Controlled by state rather than `group-hover:visible`, because a CSS-hover
 * menu cannot close itself: clicking one of its links navigates, but the
 * pointer is still inside the panel, so `:hover` holds it open over the page
 * the visitor just asked for. `group-focus-within` made it worse — the clicked
 * link keeps focus, so the menu stayed up even after the mouse left.
 *
 * Hover still opens it instantly; closing is deliberate (a link, a route
 * change, Escape, or a click outside) with a short grace period so crossing the
 * gap between the trigger and the panel doesn't dismiss it.
 */
export function NavDropdown({
  href,
  label,
  items,
}: {
  href: string;
  label: string;
  items: readonly NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };
  const closeNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(false);
  };

  // Close once the navigation actually lands. Covers the paths a click handler
  // misses: keyboard activation, the back button, and a link to the page the
  // visitor is already on.
  //
  // Adjusted during render rather than in an effect, which is React's own
  // pattern for reacting to a changed input: an effect would paint the menu
  // still open over the new page for a frame before closing it.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  // No need to clear a pending close timer here: if one fires it only sets the
  // same `false`, and `openNow` clears it before any reopen.

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeNow();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <div className="flex items-center">
        <Link
          href={href}
          onClick={closeNow}
          className="flex items-center gap-1 rounded-full py-1.5 pl-3 pr-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {label}
        </Link>
        <button
          type="button"
          aria-label={`${label} menu`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="rounded-full py-1.5 pl-0.5 pr-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top center" }}
            className="absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-2"
          >
            <div className="rounded-2xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]">
              {items.map((item) => (
                <Link
                  key={item.href}
                  role="menuitem"
                  href={item.href}
                  onClick={closeNow}
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
