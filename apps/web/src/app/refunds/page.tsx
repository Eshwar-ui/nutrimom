import type { CancellationPolicy } from "@nutrimom/shared";
import { LegalDoc, type LegalSection } from "@/components/legal-doc";
import { legalMetadata } from "@/lib/business-profile";
import { request } from "@/lib/api";

export const generateMetadata = () =>
  legalMetadata(
    "Refund & Cancellation Policy",
    "/refunds",
    "When an order can be cancelled on The Nurture Moms, how much is refunded, and how long the refund takes to reach you.",
  );

// Fallback for the rare render where the API is unreachable — matches the
// column default, so the page still states a window rather than a blank.
const DEFAULT_CONDITION_DISPUTE_HOURS = 48;

/** "48 hours" / "1 hour" / "72 hours" — the window as published prose. */
function disputeWindow(hours: number): string {
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/**
 * The stated cancellation window and refund share are read from the same
 * CancellationPolicy row the server actually enforces in OrdersService.cancel
 * — so an admin editing the policy can't leave this page describing rules
 * that no longer apply. Falls back to the shipped defaults if the API is
 * unreachable at build/render time.
 */
async function getPolicy(): Promise<CancellationPolicy | null> {
  try {
    return await request<CancellationPolicy>("/cancellation-policy", {
      revalidate: 60,
    });
  } catch {
    return null;
  }
}

function buildSections(policy: CancellationPolicy | null): LegalSection[] {
  const window = policy
    ? `within ${policy.cutoffHours} hour${policy.cutoffHours === 1 ? "" : "s"} of placing it`
    : "within the cancellation window shown at checkout";
  const share =
    policy && policy.refundPercentage < 100
      ? `${policy.refundPercentage}% of what you paid`
      : "the full amount you paid";

  return [
  {
    id: "cancelling-an-order",
    title: "Cancelling an order",
    body: (
      <>
        <p>
          You can cancel an order yourself from{" "}
          <a href="/account/orders">My orders</a> {window}, provided the seller
          has not yet generated a shipping label for it. Once a label exists the
          item is already being prepared for dispatch, so cancellation has to go
          through us — use the <a href="/contact">Contact page</a> with your
          order number.
        </p>
        <p className="mt-3">
          A cancelled paid order is refunded {share}, and the item is returned to
          the marketplace for other buyers.
        </p>
      </>
    ),
  },
  {
    id: "refund-timeline",
    title: "Refund timeline",
    body: (
      <p>
        Refunds are initiated automatically to your original payment method at
        the moment a cancellation is accepted — there is no separate approval
        step to wait for. Once initiated, our payment gateway typically takes
        5&ndash;7 working days to settle the money back to your bank or card,
        depending on your bank. If a refund has not reached you after 7 working
        days, contact us with your order number and we will trace it.
      </p>
    ),
  },
  {
    id: "returns-for-item-condition",
    title: "Returns for item condition",
    body: (
      <p>
        Because items are secondhand and described by individual sellers, we
        recommend reviewing photos and messaging the seller before buying. If an
        item arrives significantly different from its listing,{" "}
        {`contact us within ${disputeWindow(
          policy?.conditionDisputeHours ?? DEFAULT_CONDITION_DISPUTE_HOURS,
        )} of delivery`}{" "}
        with photos of the item as received — we&apos;ll review it against the
        listing on a case-by-case
        basis and, where the complaint is upheld, refund you and recover the
        amount from the seller&apos;s payout.
      </p>
    ),
  },
  {
    id: "non-refundable-situations",
    title: "Non-refundable situations",
    body: (
      <p>
        Change-of-mind returns after delivery, items marked as final sale, and
        orders cancelled by the buyer after handover has already occurred are
        not eligible for a refund.
      </p>
    ),
  },
  {
    id: "how-to-request-a-refund",
    title: "How to request a refund",
    body: (
      <p>
        For anything you can&apos;t cancel yourself, use the{" "}
        <a href="/contact">Contact page</a> with your order number and reason.
        Refund decisions and grievances are handled by the officer named at the
        end of this page.
      </p>
    ),
  },
  ];
}

export default async function RefundsPage() {
  const policy = await getPolicy();
  return (
    <LegalDoc
      title="Refund & Cancellation Policy"
      lastUpdated="5 August 2026"
      currentHref="/refunds"
      intro="How cancellations, refunds, and condition disputes are handled on the marketplace."
      sections={buildSections(policy)}
    />
  );
}
