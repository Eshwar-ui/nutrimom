"use client";

import Link from "next/link";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

/**
 * A link that records a conversion event when it is followed.
 *
 * It exists so the pages that own these links can stay server components. The
 * pillar grid, the stage selector and the service pages are all rendered on the
 * server; without this, measuring a click would mean marking each of those
 * "use client" and shipping their copy and layout to the browser for the sake
 * of one `onClick`.
 *
 * The event fires on click rather than on arrival at the destination, which is
 * the honest reading of "click-through rate" in the brief (§16) and also the
 * only one that survives a visitor opening the link in a new tab.
 */
export function TrackedLink({
  event,
  eventProps,
  children,
  ...props
}: React.ComponentProps<typeof Link> & {
  event: AnalyticsEvent;
  eventProps?: Record<string, string | number | boolean | null>;
}) {
  return (
    <Link {...props} onClick={() => trackEvent(event, eventProps)}>
      {children}
    </Link>
  );
}

/**
 * The same, for an external destination — a WhatsApp deep link, which is not a
 * route and so must not go through next/link.
 */
export function TrackedExternalLink({
  event,
  eventProps,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: AnalyticsEvent;
  eventProps?: Record<string, string | number | boolean | null>;
}) {
  return (
    <a {...props} onClick={() => trackEvent(event, eventProps)}>
      {children}
    </a>
  );
}
