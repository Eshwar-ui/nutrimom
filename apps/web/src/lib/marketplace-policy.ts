import type { CancellationPolicy } from "@nutrimom/shared";
import { request } from "./api";

/**
 * Server-side reads of the marketplace rules that public pages quote back to
 * buyers and sellers (/faq, /preloved). Each page states these figures from
 * the same rows the API enforces, so an admin edit at /admin/settings can't
 * leave a page promising something the code no longer does.
 *
 * Both fail soft to null; callers word the sentence without the figure rather
 * than falling back to a typed-in number that may be wrong.
 */

/** The live cancellation window, refund % and condition-dispute window. */
export async function getCancellationPolicy(): Promise<CancellationPolicy | null> {
  try {
    return await request<CancellationPolicy>("/cancellation-policy", {
      revalidate: 300,
    });
  } catch {
    return null;
  }
}

/**
 * The commission sellers pay on each sale, in basis points.
 *
 * Reads the public, read-only `GET /payout-policy` (`{ commissionBps }`),
 * which mirrors the public `/cancellation-policy`; writes stay on the
 * admin-only `/admin/payout-policy`. If the API is unreachable this returns
 * null and /preloved and /faq describe the commission without a percentage.
 */
export async function getCommissionBps(): Promise<number | null> {
  try {
    const policy = await request<{ commissionBps?: unknown }>("/payout-policy", {
      revalidate: 300,
    });
    return typeof policy?.commissionBps === "number" ? policy.commissionBps : null;
  } catch {
    return null;
  }
}

/** "24 hours" / "1 hour". */
export function hoursText(hours: number): string {
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** The share of the order a cancellation refunds, as published prose. */
export function refundShareText(policy: CancellationPolicy | null): string {
  if (!policy) return "the refund shown when you cancel";
  return policy.refundPercentage >= 100
    ? "a full refund"
    : `${policy.refundPercentage}% of what you paid`;
}
