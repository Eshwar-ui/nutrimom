"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star, Check } from "lucide-react";
import type { CreateReviewInput, Review } from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewForm({ orderId, listingId }: { orderId: string; listingId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      authedRequest<Review>(`/orders/${orderId}/reviews`, {
        method: "POST",
        body: { listingId, rating, comment } satisfies CreateReviewInput,
      }),
  });

  if (submit.isSuccess) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
        <Check className="h-3.5 w-3.5" /> Thanks — you rated this seller {submit.data.rating}/5.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-medium text-accent hover:underline"
      >
        Rate this seller
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                (hover || rating) >= n ? "fill-gold text-gold" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional — how was the item and handover?"
        rows={2}
        className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none"
      />
      {submit.isError && (
        <p className="mt-1 text-xs text-accent">
          {submit.error instanceof ApiError ? submit.error.message : "Couldn't submit your review."}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          disabled={rating === 0 || submit.isPending}
          onClick={() => submit.mutate()}
        >
          {submit.isPending ? "Submitting…" : "Submit rating"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
