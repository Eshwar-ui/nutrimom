"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { PINCODE_REGEX, conditionLabels, deliveryLabels } from "@nutrimom/shared";
import { getListingLocations } from "@/lib/listings";
import { listingsHref, type ListingsSearchParams } from "@/lib/listings-url";
import { Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CityCombobox } from "@/components/city-combobox";
import { cn } from "@/lib/utils";

const conditionOptions = [{ value: "", label: "Any" }, ...Object.entries(conditionLabels).map(([value, label]) => ({ value, label }))];
const deliveryOptions = [{ value: "", label: "Any" }, ...Object.entries(deliveryLabels).map(([value, label]) => ({ value, label }))];

/** The keys this panel owns; everything else in the URL (category, search, sort) is kept. */
type Draft = Required<Pick<ListingsSearchParams, "condition" | "delivery" | "city" | "locality" | "pincode" | "min" | "max">>;

const draftFrom = (sp: ListingsSearchParams): Draft => ({
  condition: sp.condition ?? "",
  delivery: sp.delivery ?? "",
  city: sp.city ?? "",
  locality: sp.locality ?? "",
  pincode: sp.pincode ?? "",
  min: sp.min ?? "",
  max: sp.max ?? "",
});

/**
 * Condition, delivery, location and price. Applies by navigating, so every
 * filter lands in the URL alongside the category, search and sort already
 * there (and the page resets to 1).
 */
export function ListingsFilters({ sp, onApplied }: { sp: ListingsSearchParams; onApplied?: () => void }) {
  const router = useRouter();
  const uid = useId();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(sp));
  const [pinError, setPinError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Locality suggestions for the chosen city, from where listings actually are.
  const { data: places } = useQuery({
    queryKey: ["listing-locations", draft.city.toLowerCase()],
    queryFn: () => getListingLocations(draft.city),
    enabled: !!draft.city,
    staleTime: 5 * 60_000,
  });

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const pincode = draft.pincode.trim();
    if (pincode && !PINCODE_REGEX.test(pincode)) {
      setPinError("Enter a 6-digit PIN code");
      return;
    }
    setPinError(null);
    router.push(listingsHref(sp, { ...draft, pincode, page: undefined }));
    onApplied?.();
  };

  const clear = () => {
    const empty = draftFrom({});
    setDraft(empty);
    setPinError(null);
    router.push(listingsHref(sp, { ...empty, page: undefined }));
    onApplied?.();
  };

  const dirtyFromUrl = Object.values(draftFrom(sp)).some(Boolean);
  const label = "mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground";

  return (
    <form onSubmit={apply} className="space-y-5" aria-label="Filter listings">
      <div>
        <label htmlFor={`${uid}-city`} className={label}>City</label>
        <CityCombobox
          id={`${uid}-city`}
          mode="filter"
          value={draft.city}
          onChange={(city) =>
            // A locality only means something inside its own city.
            setDraft((d) => ({ ...d, city, locality: city.toLowerCase() === d.city.toLowerCase() ? d.locality : "" }))
          }
        />
      </div>

      <div>
        <label htmlFor={`${uid}-locality`} className={label}>Locality</label>
        <Input
          id={`${uid}-locality`}
          value={draft.locality}
          onChange={(e) => set("locality", e.target.value)}
          list={places?.localities.length ? `${uid}-localities` : undefined}
          placeholder={draft.city ? `Any area in ${draft.city}` : "Any area"}
          autoComplete="off"
          maxLength={60}
        />
        {places && places.localities.length > 0 && (
          <datalist id={`${uid}-localities`}>
            {places.localities.map((l) => (
              <option key={l.name} value={l.name}>{`${l.count} listing${l.count === 1 ? "" : "s"}`}</option>
            ))}
          </datalist>
        )}
      </div>

      <div>
        <label htmlFor={`${uid}-pincode`} className={label}>PIN code</label>
        <Input
          id={`${uid}-pincode`}
          value={draft.pincode}
          onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="6 digits"
          aria-invalid={!!pinError || undefined}
          aria-describedby={pinError ? `${uid}-pincode-error` : undefined}
        />
        {pinError && <p id={`${uid}-pincode-error`} className="mt-1.5 text-xs text-danger">{pinError}</p>}
      </div>

      <PillGroup legend="Condition" name={`${uid}-condition`} options={conditionOptions} value={draft.condition} onChange={(v) => set("condition", v)} />
      <PillGroup legend="Delivery or pickup" name={`${uid}-delivery`} options={deliveryOptions} value={draft.delivery} onChange={(v) => set("delivery", v)} />

      <fieldset>
        <legend className={label}>Price (₹)</legend>
        <div className="flex items-center gap-2">
          <Input aria-label="Minimum price in rupees" type="number" inputMode="numeric" min="0" value={draft.min} onChange={(e) => set("min", e.target.value)} placeholder="Min" />
          <span className="text-muted-foreground" aria-hidden>–</span>
          <Input aria-label="Maximum price in rupees" type="number" inputMode="numeric" min="0" value={draft.max} onChange={(e) => set("max", e.target.value)} placeholder="Max" />
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Apply</Button>
        {dirtyFromUrl && (
          <Button type="button" variant="outline" onClick={clear}>Clear</Button>
        )}
      </div>
    </form>
  );
}

function PillGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-9 items-center rounded-full border border-border-control/45 bg-surface px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Below `lg`, the filter panel lives in a dialog behind a "Filters" button. */
export function ListingsFilterSheet({ sp, activeCount }: { sp: ListingsSearchParams; activeCount: number }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-border-control/45 bg-surface px-4 font-semibold text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
      >
        <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filters</span>
        <span className="text-xs font-medium text-muted-foreground">
          {activeCount > 0 ? `${activeCount} active` : "City, PIN, condition, price"}
        </span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy={titleId} className="max-h-[88dvh] max-w-lg overflow-y-auto p-5 sm:p-6">
        <h2 id={titleId} className="mb-5 pr-10 font-display text-2xl font-semibold text-foreground">Filters</h2>
        {/* Keyed on the URL so reopening after a change starts from what's applied. */}
        <ListingsFilters key={JSON.stringify(sp)} sp={sp} onApplied={() => setOpen(false)} />
      </Modal>
    </>
  );
}
