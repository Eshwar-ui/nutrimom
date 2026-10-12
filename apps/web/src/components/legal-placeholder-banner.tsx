import { AlertTriangle } from "lucide-react";

/** Marks a legal page as template content — not a substitute for real legal review. */
export function LegalPlaceholderBanner() {
  return (
    <div className="mb-8 flex gap-3 rounded-2xl border-2 border-dashed border-gold/50 bg-gold/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className="text-foreground">
        <span className="font-semibold">Pre-launch legal draft.</span> Business,
        grievance and support contact details still require the operator&apos;s verified
        information and legal review before this page can be indexed.
      </p>
    </div>
  );
}
