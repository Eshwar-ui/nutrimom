"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import type { Category, Listing, ListingStatus } from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { getCategories } from "@/lib/listings";
import { toast } from "@/lib/toast-store";
import { Card, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { ListingDetail } from "@/components/listing-detail";
import { RejectListingDialog } from "@/components/reject-listing-dialog";
import { CustomSelect } from "@/components/ui/custom-select";

/**
 * Admin review of a single listing — the buyer-facing product page plus a
 * moderation bar. Fetched with the admin's token so items still awaiting
 * review (which 404 on the public route) can actually be seen before a
 * decision is made.
 */
export default function AdminListingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["admin-listing", id],
    queryFn: () => authedRequest<Listing>(`/listings/${id}`),
    retry: false,
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const reassignCategory = useMutation({
    mutationFn: (categoryId: string) =>
      authedRequest<Listing>(`/admin/listings/${id}/category`, {
        method: "PATCH",
        body: { categoryId },
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["admin-listing", id], updated);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Category updated");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't change the category."),
  });

  const moderate = useMutation({
    mutationFn: ({ status, reason }: { status: ListingStatus; reason?: string }) =>
      authedRequest<Listing>(`/admin/listings/${id}/moderate`, {
        method: "PATCH",
        body: { status, reason },
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["admin-listing", id], updated);
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(updated.status === "APPROVED" ? "Listing approved" : "Listing rejected");
      router.push("/admin/listings");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't update this listing."),
  });

  const [rejecting, setRejecting] = useState(false);

  if (isLoading) return <PageSkeleton rows={4} />;
  if (error || !listing) {
    return (
      <StatePanel
        tone="error"
        title="Listing not found"
        description="It may have been deleted, or the link might be wrong."
        action={
          <Link href="/admin/listings" className="text-sm underline">
            Back to listings
          </Link>
        }
      />
    );
  }

  const awaitingReview = listing.status === "PENDING";

  return (
    <ListingDetail
      listing={listing}
      backHref="/admin/listings"
      backLabel="Back to moderation"
      // Buy/wishlist controls belong to buyers, not to a moderator.
      showActions={false}
      banner={
        <Card className="mb-8 space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">
                Admin review
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {awaitingReview
                  ? "This listing is awaiting review and is not visible to buyers yet."
                  : "Viewing as an admin — buyers see this only when it is approved."}
              </p>
            </div>
            <ListingStatusBadge status={listing.status} />
            {awaitingReview && (
              <div className="flex gap-2">
                <Button
                  className="gap-1.5"
                  disabled={moderate.isPending}
                  onClick={() => moderate.mutate({ status: "APPROVED" })}
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 text-danger"
                  disabled={moderate.isPending}
                  onClick={() => setRejecting(true)}
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Label htmlFor="listing-category" className="shrink-0">Category</Label>
            <CustomSelect
              id="listing-category"
              value={listing.category.id}
              onChange={(categoryId) => reassignCategory.mutate(categoryId)}
              options={(categories ?? []).map((category: Category) => ({ value: category.id, label: category.name }))}
              disabled={reassignCategory.isPending}
              className="max-w-xs"
            />
          </div>
        </Card>
      }
      after={
        rejecting && (
        <RejectListingDialog
          listingTitle={listing.title}
          pending={moderate.isPending}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) =>
            moderate.mutate({ status: "REJECTED", reason }, { onSettled: () => setRejecting(false) })
          }
        />
        )
      }
    />
  );
}
