import { track } from "@vercel/analytics";

/**
 * The conversion events the founders' brief asks to be measured (§16).
 *
 * Named as a closed union rather than free strings because these are the whole
 * point of the measurement plan — "understand which motherhood need brought a
 * visitor in and whether the site made the next step obvious". A typo in an
 * event name does not fail anywhere; it just produces a funnel with a hole in
 * it that nobody notices for a quarter.
 *
 * Page views, traffic sources and returning visitors are already covered by
 * Vercel Analytics itself, so §16's "top Instagram landing pages" and "repeat
 * visitors" need nothing here.
 */
export type AnalyticsEvent =
  /** Home → a pillar. Which of the four a visitor picks is the headline number. */
  | "pillar_click"
  /** Home → a stage card. Says which need brought them in, in their words. */
  | "stage_click"
  /** A booking CTA on a service page. Carries the WhatsApp funnel keyword. */
  | "booking_cta_click"
  /** A marketplace action from the Preloved pillar. */
  | "preloved_click"
  /** A free guide downloaded. Carries the guide slug and where it was clicked. */
  | "resource_download";

type EventProps = Record<string, string | number | boolean | null>;

/**
 * Records a conversion event.
 *
 * Deliberately swallows its own failures: analytics is never a reason for a
 * link not to work. `track` no-ops in development and outside Vercel anyway,
 * so a missing provider is the normal local case rather than an error.
 */
export function trackEvent(event: AnalyticsEvent, props?: EventProps): void {
  try {
    track(event, props);
  } catch {
    // Measurement must never break navigation.
  }
}
