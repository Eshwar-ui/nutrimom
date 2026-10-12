"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

const styles: Record<ToastVariant, { icon: typeof Info; classes: string }> = {
  success: { icon: CheckCircle2, classes: "bg-sage/95 text-[#1f3a1c]" },
  error: { icon: XCircle, classes: "bg-accent/95 text-accent-foreground" },
  info: { icon: Info, classes: "bg-foreground/95 text-background" },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, classes } = styles[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full px-4 py-3 text-sm font-semibold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]",
                classes,
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
