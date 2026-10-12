import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatePanel({
  title,
  description,
  action,
  icon: Icon = Inbox,
  tone = "neutral",
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "error";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed px-6 py-14 text-center",
        tone === "error" ? "border-danger/35 bg-danger/5" : "border-border-control/45 bg-surface/55",
        className,
      )}
      role={tone === "error" ? "alert" : undefined}
    >
      <span className={cn("mx-auto grid h-14 w-14 place-items-center rounded-full", tone === "error" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary")}>
        {tone === "error" ? <AlertCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function PageSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-5", className)} aria-busy="true" aria-label="Loading content">
      <div className="h-11 w-56 rounded-2xl bg-muted" />
      <div className="h-4 w-full max-w-md rounded-full bg-muted" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl border border-border bg-surface/70" />
        ))}
      </div>
    </div>
  );
}
