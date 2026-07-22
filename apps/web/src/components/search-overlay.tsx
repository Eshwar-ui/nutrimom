"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Search, SearchX, X } from "lucide-react";
import {
  formatPaise,
  type Listing,
  type Paginated,
} from "@nutrimom/shared";
import { request } from "@/lib/api";
import { cn } from "@/lib/utils";

function useDebouncedValue(value: string, delay = 220) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim());
  const hasSearch = debouncedQuery.length >= 2;

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);

    // Keep Tab from escaping into the (visually hidden) page behind — Escape
    // itself is handled by the parent SiteHeader, which owns `open`.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const resetTimer = window.setTimeout(() => setQuery(""), 0);
    return () => window.clearTimeout(resetTimer);
  }, [open]);

  const searchPath = useMemo(() => {
    const params = new URLSearchParams({
      search: debouncedQuery,
      pageSize: "6",
    });
    return `/listings?${params.toString()}`;
  }, [debouncedQuery]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["header-search", debouncedQuery],
    queryFn: () => request<Paginated<Listing>>(searchPath),
    enabled: open && hasSearch,
    staleTime: 20_000,
  });

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = query.trim();
    setQuery("");
    onOpenChange(false);
    router.push(next ? `/listings?search=${encodeURIComponent(next)}` : "/listings");
  };

  const close = () => {
    setQuery("");
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Search listings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-[#4b3a30]/55 px-4 pt-24 backdrop-blur-md sm:pt-28"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <motion.div
            initial={{ y: -18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-3xl"
          >
            <form
              onSubmit={submitSearch}
              role="search"
              className="relative flex h-16 items-center rounded-full bg-surface px-5 shadow-[0_24px_70px_-30px_rgba(36,28,24,0.65)] ring-1 ring-white/40"
            >
              <Search className="h-5 w-5 shrink-0 text-[#8b5a23]" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for strollers, maternity wear, toys..."
                aria-label="Search listings"
                className="min-w-0 flex-1 bg-transparent px-4 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/65 sm:text-lg"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={close}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </form>

            <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-white/70">
              Press <kbd className="rounded-md bg-white/20 px-2 py-0.5 tracking-normal text-white">Esc</kbd> to close
            </p>

            <SearchResultsPanel
              query={debouncedQuery}
              data={data}
              loading={isFetching}
              error={isError}
              visible={hasSearch}
              onClose={close}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchResultsPanel({
  query,
  data,
  loading,
  error,
  visible,
  onClose,
}: {
  query: string;
  data?: Paginated<Listing>;
  loading: boolean;
  error: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;

  const listings = data?.items ?? [];

  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 10, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/35 bg-surface/95 shadow-[0_26px_80px_-36px_rgba(36,28,24,0.7)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="text-sm font-bold text-foreground">Search results</p>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {error ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Search is unavailable right now. Try opening the full shop.
        </div>
      ) : listings.length > 0 ? (
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted"
            >
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {listing.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-sm font-bold text-foreground">
                  {listing.title}
                </span>
                <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{listing.city}</span>
                  <span className="shrink-0">/</span>
                  <span className="truncate">{listing.category.name}</span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-extrabold text-primary">
                {formatPaise(listing.sellingPriceInPaise)}
              </span>
            </Link>
          ))}
        </div>
      ) : loading ? (
        <div className="space-y-2 p-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
              <div className="h-16 w-16 rounded-2xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-muted" />
                <div className="h-3 w-1/2 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <SearchX className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No matches for &quot;{query}&quot;
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Try a category, brand, item type, or city.</p>
        </div>
      )}

      <Link
        href={`/listings?search=${encodeURIComponent(query)}`}
        onClick={onClose}
        className={cn(
          "flex items-center justify-center border-t border-border px-5 py-4 text-sm font-bold text-primary transition-colors hover:bg-primary/5",
          !query && "pointer-events-none opacity-50",
        )}
      >
        View all results
      </Link>
    </motion.div>
  );
}
