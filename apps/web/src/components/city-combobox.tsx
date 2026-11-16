"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, MapPin, Plus, X } from "lucide-react";
import { INDIAN_CITIES, normaliseCity } from "@nutrimom/shared";
import { getListingLocations } from "@/lib/listings";
import { cn } from "@/lib/utils";

type OptionKind = "listed" | "city" | "other";
interface Option {
  value: string;
  label: string;
  detail?: string;
  kind: OptionKind;
}

/** How many plain (no-listings) cities render at once; typing narrows it. */
const MAX_PLAIN = 40;
const MENU_MAX_HEIGHT = 288;
const GAP = 6;

const lower = (s: string) => s.toLowerCase();

/** Shared by every combobox on a page: one request, cached for 5 minutes. */
export function useListingCities() {
  return useQuery({
    queryKey: ["listing-locations"],
    queryFn: () => getListingLocations(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Type-to-search city picker (ARIA 1.2 combobox with a listbox popup).
 *
 * Cities that have live listings come first, with counts, then the rest of
 * INDIAN_CITIES. Two modes:
 *  - `filter` — choose a city to filter by; free text that matches no city is
 *    discarded on blur, so the URL only ever holds a real choice.
 *  - `form` — choose from the list, or keep what was typed as an "Other" city
 *    (tidied by normaliseCity, the same rule the API applies).
 *
 * The popup is portalled and fixed-positioned (like CustomSelect) so cards
 * with `overflow-hidden` and the mobile filter sheet can't clip it, and it
 * sizes itself to the visual viewport so an on-screen keyboard can't hide it.
 */
export function CityCombobox({
  id,
  value,
  onChange,
  mode = "filter",
  placeholder = mode === "filter" ? "Any city" : "Start typing your city",
  invalid,
  describedBy,
  ariaLabel,
  className,
}: {
  id: string;
  value: string;
  onChange: (city: string) => void;
  mode?: "filter" | "form";
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Use when there's no visible <label htmlFor={id}>. */
  ariaLabel?: string;
  className?: string;
}) {
  const uid = useId();
  const listboxId = `${id}-listbox`;
  const optionId = (i: number) => `${id}-opt-${i}`;
  const { data: locations } = useListingCities();

  // null = not editing: the input shows `value`. A string = what's being typed.
  const [typed, setTyped] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; maxHeight: number; flip: boolean } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const query = (typed ?? "").trim();

  const { listed, plain, other, options } = useMemo(() => {
    const q = lower(query);
    const canonical = q ? lower(normaliseCity(query)) : "";
    const matches = (name: string) => !q || lower(name).includes(q) || lower(name) === canonical;
    // Prefix matches first, otherwise keep the incoming order (count / A–Z).
    const byPrefix = <T extends { name: string }>(list: T[]) =>
      q ? [...list].sort((a, b) => Number(!lower(a.name).startsWith(q)) - Number(!lower(b.name).startsWith(q))) : list;

    const listedCities = locations?.cities ?? [];
    const listedKeys = new Set(listedCities.map((c) => lower(c.name)));
    const listed: Option[] = byPrefix(listedCities.filter((c) => matches(c.name))).map((c) => ({
      value: c.name,
      label: c.name,
      detail: `${c.count} listing${c.count === 1 ? "" : "s"}`,
      kind: "listed",
    }));
    const plainAll = byPrefix(INDIAN_CITIES.filter((c) => !listedKeys.has(lower(c.name)) && matches(c.name)));
    const plain: Option[] = plainAll.slice(0, MAX_PLAIN).map((c) => ({
      value: c.name,
      label: c.name,
      detail: c.state,
      kind: "city",
    }));

    let other: Option | null = null;
    if (mode === "form" && q) {
      const tidy = normaliseCity(query);
      const known = [...listed, ...plain].some((o) => lower(o.value) === lower(tidy));
      if (!known) other = { value: tidy, label: `Use “${tidy}”`, detail: "Other city", kind: "other" };
    }
    return {
      listed,
      plain: { shown: plain, total: plainAll.length },
      other,
      options: [...listed, ...plain, ...(other ? [other] : [])],
    };
  }, [locations, query, mode]);

  const place = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    const below = viewport - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const flip = below < 180 && above > below;
    setRect({
      top: flip ? r.top - GAP : r.bottom + GAP,
      left: r.left,
      width: r.width,
      maxHeight: Math.max(120, Math.min(MENU_MAX_HEIGHT, flip ? above : below)),
      flip,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [open, place]);

  // Keep the highlighted option in view while arrowing through.
  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from `id`, which is stable for this instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  const openMenu = () => {
    const i = options.findIndex((o) => lower(o.value) === lower(value));
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  };

  const choose = (option: Option) => {
    onChange(option.value);
    setTyped(null);
    setOpen(false);
  };

  /** Leaving the field: settle whatever was typed into a value (or drop it). */
  const commit = () => {
    setOpen(false);
    if (typed === null) return;
    const text = typed.trim();
    setTyped(null);
    if (!text) {
      if (value) onChange("");
      return;
    }
    const tidy = normaliseCity(text);
    const exact = options.find((o) => o.kind !== "other" && lower(o.value) === lower(tidy));
    if (exact) onChange(exact.value);
    else if (mode === "form") onChange(tidy);
    // filter mode: an unknown city is discarded — the input reverts to `value`.
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openMenu();
      else setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openMenu();
      else setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && options[active]) {
        e.preventDefault();
        choose(options[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        // Close just the list, not a dialog this sits in (the mobile filter
        // sheet closes on Escape at the document level).
        e.stopPropagation();
        setOpen(false);
      } else if (typed !== null) {
        e.preventDefault();
        setTyped(null);
      }
    }
  };

  const renderOption = (option: Option, index: number) => {
    const selected = !!value && lower(option.value) === lower(value);
    return (
      <div
        key={`${option.kind}-${option.value}`}
        id={optionId(index)}
        role="option"
        aria-selected={index === active}
        // Keep focus in the input so choosing doesn't fire a blur-commit first.
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActive(index)}
        onClick={() => choose(option)}
        className={cn(
          "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm",
          index === active ? "bg-muted" : "",
          selected ? "font-semibold text-primary" : "text-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {option.kind === "other" ? (
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <MapPin className={cn("h-4 w-4 shrink-0", option.kind === "listed" ? "text-primary" : "text-muted-foreground")} />
          )}
          <span className="truncate">{option.label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-muted-foreground">
          {option.detail}
          {selected && <Check className="h-4 w-4 text-primary" />}
        </span>
      </div>
    );
  };

  const groupLabel = (labelId: string, text: string) => (
    <div id={labelId} role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {text}
    </div>
  );

  const menu = open && rect && (
    <div
      ref={listRef}
      id={listboxId}
      role="listbox"
      aria-label="Cities"
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: Math.max(rect.width, 240),
        maxHeight: rect.maxHeight,
        transform: rect.flip ? "translateY(-100%)" : undefined,
      }}
      className="z-[90] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-1.5 shadow-pop"
    >
      {options.length === 0 ? (
        <p className="px-3 py-3 text-sm text-muted-foreground">
          {mode === "filter" ? "No city matches that. Try another spelling." : "Keep typing your city."}
        </p>
      ) : (
        <>
          {listed.length > 0 && (
            <div role="group" aria-labelledby={`${uid}-listed`}>
              {groupLabel(`${uid}-listed`, "Cities with listings")}
              {listed.map((o, i) => renderOption(o, i))}
            </div>
          )}
          {plain.shown.length > 0 && (
            <div role="group" aria-labelledby={`${uid}-all`}>
              {groupLabel(`${uid}-all`, listed.length > 0 ? "More cities" : "Cities")}
              {plain.shown.map((o, i) => renderOption(o, listed.length + i))}
              {plain.total > plain.shown.length && (
                <p role="presentation" className="px-3 py-2 text-xs text-muted-foreground">
                  Type to search {plain.total - plain.shown.length} more…
                </p>
              )}
            </div>
          )}
          {other && (
            <div role="group" aria-labelledby={`${uid}-other`}>
              {groupLabel(`${uid}-other`, "Not in the list?")}
              {renderOption(other, listed.length + plain.shown.length)}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && options[active] ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="done"
        placeholder={placeholder}
        value={typed ?? value}
        onChange={(e) => {
          setTyped(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => {
          if (!open) openMenu();
        }}
        onClick={() => {
          if (!open) openMenu();
        }}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={cn(
          "h-11 w-full rounded-xl border bg-surface pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          invalid ? "border-danger ring-2 ring-danger/20" : "border-border-control/60",
        )}
      />
      <span className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
        {value && typed === null && (
          <button
            type="button"
            aria-label={`Clear city (${value})`}
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown
          aria-hidden
          className={cn("mr-2 h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </span>
      <span className="sr-only" aria-live="polite">
        {open ? `${options.length} ${options.length === 1 ? "city" : "cities"} available` : ""}
      </span>
      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}
