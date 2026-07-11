import { AlertTriangle } from "lucide-react";

/** Marks a legal page as template content — not a substitute for real legal review. */
export function LegalPlaceholderBanner() {
  return (
    <div className="mb-8 flex gap-3 rounded-2xl border-2 border-dashed border-gold/50 bg-gold/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className="text-foreground">
        <span className="font-semibold">Placeholder content.</span> The bracketed
        details below need your real business information, and this page should be
        reviewed by a lawyer before going live — it is not legal advice.
      </p>
    </div>
  );
}
