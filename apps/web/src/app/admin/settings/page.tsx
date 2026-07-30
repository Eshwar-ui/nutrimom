"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import type { CancellationPolicy, CancellationPolicyInput } from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/states";

export default function AdminSettingsPage() {
  const { data: policy, isLoading } = useQuery({
    queryKey: ["cancellation-policy"],
    queryFn: () => authedRequest<CancellationPolicy>("/cancellation-policy"),
  });

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Marketplace policy</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">Rules for when and how buyers and admins can cancel an order.</p>
      </header>

      {isLoading || !policy ? (
        <PageSkeleton rows={3} />
      ) : (
        <CancellationPolicyForm key={policy.updatedAt} policy={policy} />
      )}
    </div>
  );
}

// Keyed on policy.updatedAt by the parent (via `key`), so this component's
// local state is seeded fresh from props once — and again after a save
// changes updatedAt — without an effect syncing state to a query result.
function CancellationPolicyForm({ policy }: { policy: CancellationPolicy }) {
  const qc = useQueryClient();
  const [cutoffHours, setCutoffHours] = useState(policy.cutoffHours);
  const [refundPercentage, setRefundPercentage] = useState(policy.refundPercentage);
  const [reasonCodes, setReasonCodes] = useState<string[]>(policy.reasonCodes);
  const [newReason, setNewReason] = useState("");

  const save = useMutation({
    mutationFn: (dto: CancellationPolicyInput) =>
      authedRequest<CancellationPolicy>("/admin/cancellation-policy", { method: "PATCH", body: dto }),
    onSuccess: (updated) => {
      qc.setQueryData(["cancellation-policy"], updated);
      toast.success("Cancellation policy updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save the policy"),
  });

  const addReason = () => {
    const trimmed = newReason.trim();
    if (!trimmed || reasonCodes.includes(trimmed)) return;
    setReasonCodes([...reasonCodes, trimmed]);
    setNewReason("");
  };

  const dirty =
    cutoffHours !== policy.cutoffHours ||
    refundPercentage !== policy.refundPercentage ||
    JSON.stringify(reasonCodes) !== JSON.stringify(policy.reasonCodes);

  return (
    <Card className="max-w-2xl space-y-6 p-6">
      <div>
        <Label htmlFor="cutoff-hours">Cancellation window (hours after placing)</Label>
        <Input
          id="cutoff-hours"
          type="number"
          min={1}
          max={24 * 90}
          value={cutoffHours}
          onChange={(e) => setCutoffHours(Number(e.target.value))}
          className="mt-1.5 max-w-[10rem]"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Orders can only be self-cancelled by the buyer within this many hours of being placed.
        </p>
      </div>

      <div>
        <Label htmlFor="refund-percentage">Refund on cancellation (%)</Label>
        <Input
          id="refund-percentage"
          type="number"
          min={0}
          max={100}
          value={refundPercentage}
          onChange={(e) => setRefundPercentage(Number(e.target.value))}
          className="mt-1.5 max-w-[10rem]"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Portion of the payment refunded when a paid order is cancelled. 100 = full refund.
        </p>
      </div>

      <div>
        <Label>Cancellation reasons</Label>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          Shown to buyers and admins when cancelling — at least one is required.
        </p>
        <div className="flex flex-wrap gap-2">
          {reasonCodes.map((reason) => (
            <span
              key={reason}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground"
            >
              {reason}
              <button
                type="button"
                aria-label={`Remove reason "${reason}"`}
                onClick={() => setReasonCodes(reasonCodes.filter((r) => r !== reason))}
                className="text-muted-foreground hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addReason();
              }
            }}
            placeholder="Add a reason…"
            maxLength={80}
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addReason}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button
          disabled={!dirty || reasonCodes.length === 0 || save.isPending}
          onClick={() => save.mutate({ cutoffHours, refundPercentage, reasonCodes })}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        {reasonCodes.length === 0 && (
          <p className="text-xs text-danger">At least one cancellation reason is required.</p>
        )}
      </div>
    </Card>
  );
}
