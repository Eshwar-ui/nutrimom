"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CancellationPolicy } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/primitives";
import { CustomSelect } from "@/components/ui/custom-select";

/**
 * Reason-required cancel dialog, shared by the buyer's own-order cancel flow
 * and the admin order-status dropdown. The reason list comes from the
 * admin-configured CancellationPolicy — never hardcoded — so it stays in
 * sync with whatever an admin has set on /admin/settings.
 */
export function CancelOrderDialog({
  title = "Cancel this order?",
  description,
  pending,
  onCancel,
  onConfirm,
}: {
  title?: string;
  description?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { data: policy } = useQuery({
    queryKey: ["cancellation-policy"],
    queryFn: () => authedRequest<CancellationPolicy>("/cancellation-policy"),
  });
  const [reason, setReason] = useState("");

  return (
    <Modal open onClose={onCancel} labelledBy="cancel-order-title" describedBy="cancel-order-help">
      <h2 id="cancel-order-title" className="font-display text-2xl font-semibold text-foreground">
        {title}
      </h2>
      <p id="cancel-order-help" className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description ??
          (policy
            ? `Orders can be cancelled within ${policy.cutoffHours} hours of being placed.`
            : "Loading the current cancellation policy…")}
      </p>

      <div className="mt-4">
        <Label htmlFor="cancel-order-reason">Reason</Label>
        <CustomSelect
          id="cancel-order-reason"
          value={reason}
          onChange={setReason}
          options={policy?.reasonCodes ?? []}
          placeholder={policy ? "Select a reason" : "Loading…"}
          disabled={!policy}
          className="mt-1.5"
        />
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Never mind
        </Button>
        <Button
          className="bg-danger text-white hover:brightness-110"
          disabled={!reason || pending}
          onClick={() => onConfirm(reason)}
        >
          {pending ? "Cancelling…" : "Cancel order"}
        </Button>
      </div>
    </Modal>
  );
}
