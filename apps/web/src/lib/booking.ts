import {
  packageBookingMessage,
  whatsappLink,
  type EnquiryService,
  type PackagePriceFields,
  type ServiceGroup,
} from "@nutrimom/shared";
import { getBusinessProfile } from "./business-profile";
import { ENQUIRY_SERVICE_SLUGS, WHATSAPP_KEYWORDS } from "./site-nav";

export type BookingIntent = keyof typeof WHATSAPP_KEYWORDS;

/**
 * Which booking funnel a package belongs to. Drives the WhatsApp keyword its
 * Book Now message opens with and the `?service=` its enquiry link carries, so
 * a package booking is attributed exactly like the page-level CTA beside it.
 * Starting Solids is its own funnel (keyword SOLIDS) even when its card shows
 * on /nutrition.
 */
export const GROUP_INTENT: Record<ServiceGroup, BookingIntent> = {
  PRENATAL_YOGA: "yoga",
  GARBHASANSKAR: "yoga",
  COMBO: "yoga",
  ONE_TO_ONE_YOGA: "yoga",
  NUTRITION: "nutrition",
  STARTING_SOLIDS: "solids",
};

/** The `ContactMessage.service` value an enquiry about this group is filed under. */
export const GROUP_ENQUIRY_SERVICE: Record<ServiceGroup, EnquiryService> = {
  PRENATAL_YOGA: "YOGA",
  GARBHASANSKAR: "YOGA",
  COMBO: "YOGA",
  ONE_TO_ONE_YOGA: "YOGA",
  NUTRITION: "NUTRITION",
  STARTING_SOLIDS: "STARTING_SOLIDS",
};

type BookablePackage = PackagePriceFields & {
  id: string;
  name: string;
  group: ServiceGroup;
};

/**
 * The operator's WhatsApp number, or null while `supportPhone` is blank at
 * /admin/settings. Callers render every Book Now as the enquiry link when this
 * is null, for the reason given on bookingWhatsappUrl below.
 */
export async function bookingPhone(): Promise<string | null> {
  const profile = await getBusinessProfile();
  return profile?.supportPhone?.trim() || null;
}

/**
 * "Book Now" for one package: WhatsApp, prefilled with the funnel keyword and
 * packageBookingMessage — the same resolvePackagePrice figure the card shows,
 * so the message can't quote a different price from the one she just tapped.
 */
export function packageWhatsappUrl(
  phone: string,
  pkg: BookablePackage,
  now?: Date,
): string {
  const keyword = WHATSAPP_KEYWORDS[GROUP_INTENT[pkg.group]];
  return whatsappLink(phone, `${keyword} — ${packageBookingMessage(pkg, now)}`);
}

/**
 * "Enquire" for one package. Only the id travels: /contact looks the package
 * up server-side and the API snapshots its name and current price itself.
 */
export function packageEnquiryHref(pkg: Pick<BookablePackage, "id" | "group">): string {
  const slug = ENQUIRY_SERVICE_SLUGS[GROUP_INTENT[pkg.group]];
  return `/contact?service=${slug}&package=${encodeURIComponent(pkg.id)}`;
}

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
