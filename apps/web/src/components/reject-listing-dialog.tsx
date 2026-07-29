"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/primitives";

/**
 * Reject-with-reason dialog. Replaces window.prompt(), which can't be styled,
 * blocks the page, is suppressed outright by some browsers, and gave no hint
 * that the seller reads what you type. The API requires a reason, so the
 * confirm button stays disabled until there is one.
 */
export function RejectListingDialog({
  listingTitle,
  pending,
  onCancel,
  onConfirm,
}: {
  listingTitle?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  // Mounted only while open (the caller renders it conditionally), so the draft
  // starts empty every time and a previous one can't be sent by mistake.
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();

  return (
    <Modal open onClose={onCancel} labelledBy="reject-title" describedBy="reject-help">
      <h2 id="reject-title" className="font-display text-2xl font-semibold text-foreground">
        Reject this listing?
      </h2>
      {listingTitle && (
        <p className="mt-1 truncate text-sm font-medium text-muted-foreground">{listingTitle}</p>
      )}
      <p id="reject-help" className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The seller will see this reason, so be specific about what they need to change.
      </p>

      <div className="mt-4">
        <Label htmlFor="reject-reason">Reason</Label>
        <Textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          autoFocus
          placeholder="Photos are too blurry to judge condition — please re-upload in better light."
          className="mt-1.5"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{reason.length}/500</p>
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button
          className="bg-danger text-white hover:brightness-110"
          disabled={!trimmed || pending}
          onClick={() => onConfirm(trimmed)}
        >
          {pending ? "Rejecting…" : "Reject listing"}
        </Button>
      </div>
    </Modal>
  );
}
