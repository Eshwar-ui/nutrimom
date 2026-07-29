"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

/** Either a plain list of labels (value === label) or explicit value/label pairs. */
type OptionsProp = readonly string[] | readonly SelectOption[];

const normalise = (options: OptionsProp): SelectOption[] =>
  options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

const MENU_MAX_HEIGHT = 256; // matches max-h-64
const GAP = 8;

/**
 * Accessible custom dropdown for forms — replaces the OS-styled <select> list
 * with a themed menu.
 *
 * The menu is portalled to <body> and positioned fixed rather than absolutely
 * inside the trigger: forms here sit in cards with `overflow-hidden`, which
 * would otherwise clip the list. It flips above the trigger when there isn't
 * room below, and tracks scroll/resize while open.
 *
 * Controlled: pass value + onChange (plays nicely with react-hook-form's
 * Controller).
 */
export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  id,
  invalid,
  disabled,
  describedBy,
  ariaLabel,
  className,
}: {
  options: OptionsProp;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  /** Use when there's no visible <label> pointing at `id`. */
  ariaLabel?: string;
  className?: string;
}) {
  const items = normalise(options);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; flip: boolean } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ query: "", at: 0 });

  const selected = items.find((o) => o.value === value);
  const listboxId = id ? `${id}-listbox` : undefined;
  const optionId = (i: number) => (id ? `${id}-option-${i}` : undefined);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP;
    // Flip up only when there genuinely isn't room below but there is above.
    const flip = below < Math.min(MENU_MAX_HEIGHT, 160) && r.top > below;
    setRect({
      top: flip ? r.top - GAP : r.bottom + GAP,
      left: r.left,
      width: r.width,
      flip,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // `true` captures scrolls on any ancestor, not just the window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  // Close on outside click (the menu lives outside this subtree, so check both).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelectorAll("li")
      [active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openMenu = () => {
    const i = items.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  };

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(items.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (items[active]) choose(items[active].value);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type-ahead: jump to the next option starting with what was typed.
      // `timeStamp` comes off the event rather than Date.now() so this stays
      // pure with respect to render.
      const now = e.timeStamp;
      const t = typeahead.current;
      t.query = now - t.at > 800 ? e.key : t.query + e.key;
      t.at = now;
      const from = t.query.length === 1 ? active + 1 : active;
      const order = [...items.slice(from), ...items.slice(0, from)];
      const hit = order.find((o) => o.label.toLowerCase().startsWith(t.query.toLowerCase()));
      if (hit) setActive(items.indexOf(hit));
    }
  };

  const menu = rect && (
    <motion.ul
      ref={listRef}
      role="listbox"
      id={listboxId}
      aria-activedescendant={optionId(active)}
      initial={{ opacity: 0, y: rect.flip ? 6 : -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: rect.flip ? 6 : -6, scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        maxHeight: MENU_MAX_HEIGHT,
        transform: rect.flip ? "translateY(-100%)" : undefined,
        transformOrigin: rect.flip ? "bottom" : "top",
      }}
      className="z-[90] overflow-auto rounded-2xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]"
    >
      {items.map((opt, i) => {
        const isSelected = opt.value === value;
        return (
          <li key={opt.value} id={optionId(i)} role="option" aria-selected={isSelected}>
            <button
              type="button"
              tabIndex={-1}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(opt.value)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                isSelected ? "font-semibold text-primary" : "font-medium text-foreground",
                i === active && !isSelected ? "bg-muted" : "",
                i === active && isSelected ? "bg-primary/10" : "",
              )}
            >
              {opt.label}
              {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          </li>
        );
      })}
    </motion.ul>
  );

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-surface px-4 text-sm transition-colors focus-visible:border-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          invalid ? "border-danger ring-2 ring-danger/20" : "border-border-control/60",
          selected ? "text-foreground" : "text-muted-foreground",
          disabled && "cursor-not-allowed bg-muted/60 opacity-70",
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Portalled so the card's `overflow-hidden` can't clip the menu. Safe to
          check `document` at render time: the menu only exists while open, and
          `open` is false during SSR and hydration, so both render nothing. */}
      {typeof document !== "undefined" &&
        createPortal(<AnimatePresence>{open && menu}</AnimatePresence>, document.body)}
    </div>
  );
}
