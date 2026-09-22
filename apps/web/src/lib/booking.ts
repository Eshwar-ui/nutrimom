import { whatsappLink } from "@nutrimom/shared";
import { getBusinessProfile } from "./business-profile";
import { WHATSAPP_KEYWORDS } from "./site-nav";

export type BookingIntent = keyof typeof WHATSAPP_KEYWORDS;

const INTENT_MESSAGE: Record<BookingIntent, string> = {
  yoga: "Hi! I'd like to know more about your yoga sessions.",
  nutrition: "Hi! I'd like to book a nutrition consultation.",
  solids: "Hi! I'd like to book a Starting Solids session.",
  community: "Hi! I'd like to join the mom support community.",
};

/**
 * The WhatsApp destination for a service enquiry, or null if the operator
 * hasn't filled in a support phone yet.
 *
 * Null is a real state, not an error: `BusinessProfile.supportPhone` is
 * admin-entered at /admin/settings and starts empty. Every caller falls back to
 * the on-site enquiry form, because a "Book a session" button that opens
 * `wa.me/` with no number is worse than one that opens a form — it looks
 * broken at the exact moment someone decided to buy.
 *
 * The message is prefixed with the funnel keyword from the founders' brief
 * (§12) so an enquiry arrives already attributed to the content that produced
 * it, without any analytics wiring.
 */
export async function bookingWhatsappUrl(
  intent: BookingIntent,
): Promise<string | null> {
  const profile = await getBusinessProfile();
  const phone = profile?.supportPhone?.trim();
  if (!phone) return null;
  return whatsappLink(
    phone,
    `${WHATSAPP_KEYWORDS[intent]} — ${INTENT_MESSAGE[intent]}`,
  );
}
