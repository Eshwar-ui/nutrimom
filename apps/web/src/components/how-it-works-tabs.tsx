"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface HowItWorksTab {
  /** Also the URL hash that opens this tab, e.g. /preloved#selling. */
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Buying · Selling · Donating as tabs. The panels are rendered on the server
 * and passed in, so all three are in the HTML (search engines and no-JS
 * readers get the full text); this only decides which one is showing.
 *
 * Follows the WAI-ARIA tabs pattern: arrow keys, Home and End move between
 * tabs, and a matching URL hash (#buying, #selling, #donating) opens a tab
 * directly, so other pages can link straight to the part they mean.
 */
export function HowItWorksTabs({ tabs }: { tabs: readonly HowItWorksTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === hash)) setActive(hash);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") focusTab(index + 1);
    else if (e.key === "ArrowLeft") focusTab(index - 1);
    else if (e.key === "Home") focusTab(0);
    else if (e.key === "End") focusTab(tabs.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="How it works"
        className="grid grid-cols-3 gap-1 rounded-full border border-border bg-surface p-1 sm:inline-grid sm:min-w-[28rem]"
      >
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              // The tab carries the bare id, so /preloved#selling scrolls to
              // a visible element (the panel is still hidden at that point).
              id={tab.id}
              aria-selected={selected}
              aria-controls={`${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "inline-flex min-h-11 scroll-mt-32 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span aria-hidden className="hidden sm:inline-flex">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${tab.id}-panel`}
          aria-labelledby={tab.id}
          hidden={tab.id !== active}
          tabIndex={0}
          className="mt-8 rounded-card"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
