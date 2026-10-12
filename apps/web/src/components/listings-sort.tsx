"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SP = Record<string, string | undefined>;

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Reference-style "SORT BY | … ▾" control with a fully custom menu (native
 *  <select> can't be styled once open). Navigates on select, preserving every
 *  other active filter in `sp`. Client-only for the popover + keyboard nav. */
export function ListingsSort({ sp }: { sp: SP }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = sp.sort ?? "newest";
  const activeIndex = Math.max(0, sorts.findIndex((s) => s.value === current));

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (value: string) => {
    setOpen(false);
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries({ ...sp, sort: value, page: undefined })) {
      if (val) params.set(key, String(val));
    }
    router.push(`/listings?${params.toString()}`);
  };

  const onButtonKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown"
        ? sorts[(activeIndex + 1) % sorts.length]
        : sorts[(activeIndex - 1 + sorts.length) % sorts.length];
      select(next.value);
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKey}
        className="flex h-12 w-full items-center gap-3 rounded-2xl border border-border-control/45 bg-surface pl-4 pr-3 transition-colors hover:border-primary/50 focus-visible:border-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-auto"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sort by</span>
        <span aria-hidden className="h-5 w-px bg-border" />
        <span className="text-sm font-semibold text-foreground">{sorts[activeIndex].label}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Sort products"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-30 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]"
          >
            {sorts.map((sort) => {
              const selected = sort.value === current;
              return (
                <li key={sort.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => select(sort.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "font-medium text-foreground hover:bg-muted",
                    )}
                  >
                    {sort.label}
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
