"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

// Building blocks shared by the admin content editors, so the five pages read
// as one tool. Same look as blog-post-form.tsx and admin/settings.

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export function Field({
  label,
  id,
  helper,
  error,
  className,
  children,
}: {
  label: string;
  id: string;
  helper?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {helper && !error && <p className="mt-1.5 text-xs text-muted-foreground">{helper}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** A labelled checkbox with an optional explanation underneath. */
export function CheckboxField({
  id,
  checked,
  onChange,
  label,
  description,
  disabled,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:bg-muted/40",
          checked && "border-primary/40 bg-primary/5",
          disabled && "cursor-not-allowed opacity-60",
          error && "border-danger/50",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>}
        </span>
      </label>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

/**
 * An ordered list of short strings (package bullets, qualifications): add,
 * edit in place, reorder, remove. Empty rows are kept while editing and the
 * shared schema reports them on save, so nothing the admin typed vanishes.
 */
export function StringListEditor({
  id,
  values,
  onChange,
  placeholder,
  addLabel = "Add",
  max,
  maxLength,
  issues,
  issuePrefix,
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  max?: number;
  maxLength?: number;
  /** Form issues, keyed by path; rows read `${issuePrefix}.${index}`. */
  issues?: Record<string, string>;
  issuePrefix?: string;
}) {
  const [draft, setDraft] = useState("");
  const full = max !== undefined && values.length >= max;

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed || full) return;
    onChange([...values, trimmed]);
    setDraft("");
  };
  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {values.map((value, index) => {
        const error = issuePrefix ? issues?.[`${issuePrefix}.${index}`] : undefined;
        return (
          <div key={index}>
            <div className="flex items-center gap-1.5">
              <Input
                aria-label={`Item ${index + 1}`}
                value={value}
                maxLength={maxLength}
                aria-invalid={!!error}
                onChange={(e) => onChange(values.map((v, i) => (i === index ? e.target.value : v)))}
              />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Move down" disabled={index === values.length - 1} onClick={() => move(index, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:text-danger" aria-label={`Remove item ${index + 1}`} onClick={() => onChange(values.filter((_, i) => i !== index))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          </div>
        );
      })}
      {!full && (
        <div className="flex gap-2">
          <Input
            id={id}
            value={draft}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 self-center" onClick={add} disabled={!draft.trim()}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Small coloured status label used in the admin lists. */
export function StatusChip({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "primary" | "gold" | "danger" | "accent";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "primary" && "bg-primary/15 text-primary",
        tone === "gold" && "bg-gold/25 text-gold-ink",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "accent" && "bg-accent/20 text-accent-text",
      )}
    >
      {children}
    </span>
  );
}

/** The red form-level alert under an editor. */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

/** The amber "this will save, but check it" note. */
export function FormWarning({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-foreground">
      {children}
    </div>
  );
}

/**
 * Confirm-before-delete. Mounted only while open (render it conditionally),
 * like RejectListingDialog — a styled dialog instead of window.confirm, which
 * some browsers suppress outright.
 */
export function ConfirmDeleteDialog({
  title,
  description,
  confirmLabel = "Delete",
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open onClose={onCancel} labelledBy="confirm-delete-title" describedBy="confirm-delete-help">
      <h2 id="confirm-delete-title" className="pr-8 font-display text-2xl font-semibold text-foreground">
        {title}
      </h2>
      <p id="confirm-delete-help" className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button className="bg-danger text-danger-foreground hover:brightness-110" disabled={pending} onClick={onConfirm}>
          {pending ? "Deleting…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
