import type { GenerateLabelResponse, SellerSale } from "@nutrimom/shared";
import { authedRequest } from "./api";

export function getSales() {
  return authedRequest<SellerSale[]>("/seller/sales");
}

export function generateLabel(orderId: string) {
  return authedRequest<GenerateLabelResponse>(
    `/seller/sales/${orderId}/label`,
    { method: "POST" },
  );
}

export function markShipped(orderId: string) {
  return authedRequest<SellerSale>(`/seller/sales/${orderId}/ship`, {
    method: "POST",
  });
}

/** Open the label for printing — a hosted PDF (courier) or inline HTML (manual). */
export function openLabel(label: GenerateLabelResponse) {
  if (label.labelUrl) {
    window.open(label.labelUrl, "_blank", "noopener");
    return;
  }
  if (label.labelHtml) {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(label.labelHtml);
      w.document.close();
    }
  }
}
