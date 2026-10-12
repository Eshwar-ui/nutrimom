import { cn } from "@/lib/utils";

/** Shimmering placeholder block that matches final content dimensions. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <div className="absolute inset-y-0 -left-1/3 w-1/3 -translate-x-full animate-[shimmer_1.6s_infinite] bg-surface/50" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface card-shadow">
      <Skeleton className="aspect-square" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="mt-2 h-5 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
