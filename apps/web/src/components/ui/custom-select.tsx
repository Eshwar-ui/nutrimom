"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible custom dropdown for forms — replaces the OS-styled <select>
 *  option list with a themed menu. Controlled: pass value + onChange (plays
 *  nicely with react-hook-form's Controller). */
export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  id,
  invalid,
  className,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Highlight the current selection whenever the menu opens.
  const openMenu = () => {
    const i = options.indexOf(value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  };

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openMenu();
      return;
    }
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose(options[active]);
      }
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-surface px-4 text-sm transition-colors focus-visible:border-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          invalid ? "border-danger ring-2 ring-danger/20" : "border-border-control/60",
          value ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-30 mt-2 max-h-64 w-full origin-top overflow-auto rounded-2xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]"
          >
            {options.map((opt, i) => {
              const selected = opt === value;
              return (
                <li key={opt} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(opt)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      selected ? "font-semibold text-primary" : "font-medium text-foreground",
                      i === active && !selected ? "bg-muted" : "",
                      i === active && selected ? "bg-primary/10" : "",
                    )}
                  >
                    {opt}
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
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
