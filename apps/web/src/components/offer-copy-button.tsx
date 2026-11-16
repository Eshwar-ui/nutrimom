"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { buttonVariants } from "./ui/button";
import { toast } from "@/lib/toast-store";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * "Copy code" on a partner offer. Confirms twice — the button itself turns
 * into "Copied" for a moment, and a toast (the toaster is an aria-live region)
 * says which code is now on the clipboard.
 *
 * The Clipboard API is missing on insecure origins and can be refused by the
 * browser; either way the toast names the code so it can be typed instead,
 * and the code stays selectable on the card.
 */
export function OfferCopyButton({
  code,
  offerId,
  brand,
}: {
  code: string;
  offerId: string;
  brand: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      toast.error(`Couldn't copy automatically — the code is ${code}`);
      return;
    }
    trackEvent("offer_copy", { offerId, brand });
    toast.success(`Code ${code} copied — paste it at checkout on ${brand}.`);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `Copied code ${code}` : `Copy code ${code}`}
      className={cn(
        buttonVariants({ variant: copied ? "primary" : "outline", size: "sm" }),
        "shrink-0",
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden /> Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden /> Copy code
        </>
      )}
    </button>
  );
}
