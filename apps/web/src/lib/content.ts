import type {
  Faq,
  FaqSection,
  PartnerOffer,
  ServiceGroup,
  ServicePackage,
  SiteContent,
  Testimonial,
} from "@nutrimom/shared";
import { request } from "./api";

// Server-side reads of the admin-editable content (public endpoints, cached +
// revalidated) — mirrors lib/listings.ts and lib/business-profile.ts.
//
// Every admin save purges the pages that read these (lib/revalidate.ts scopes
// `services` / `offers` / `faqs` / `content`), so the window below is only the
// backstop for a purge that failed.
//
// All of them fail soft: an unreachable API reads as "nothing to show", and a
// section with nothing to show stays hidden (REDESIGN-PLAN decision 5) — a
// page must never break, or fall back to placeholder content, because a fetch
// failed.

const REVALIDATE_SECONDS = 60;

/** Active packages, in page order. [] when the API is unreachable. */
export async function getServicePackages(
  group?: ServiceGroup,
): Promise<ServicePackage[]> {
  const qs = group ? `?group=${encodeURIComponent(group)}` : "";
  try {
    return await request<ServicePackage[]>(`/services/packages${qs}`, {
      revalidate: REVALIDATE_SECONDS,
    });
  } catch {
    return [];
  }
}

/**
 * Active, unexpired partner offers. The API filters expiry at read time, but
 * a cached copy can outlive an offer by up to the revalidate window — callers
 * rendering a coupon should still hide one whose `expiresAt` has passed.
 */
export async function getPartnerOffers(): Promise<PartnerOffer[]> {
  try {
    return await request<PartnerOffer[]>("/offers", {
      revalidate: REVALIDATE_SECONDS,
    });
  } catch {
    return [];
  }
}

/** Published FAQs, by section then sort order. [] when unreachable. */
export async function getFaqs(section?: FaqSection): Promise<Faq[]> {
  const qs = section ? `?section=${encodeURIComponent(section)}` : "";
  try {
    return await request<Faq[]>(`/faqs${qs}`, {
      revalidate: REVALIDATE_SECONDS,
    });
  } catch {
    return [];
  }
}

/** Published testimonials with confirmed consent only. [] when unreachable. */
export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    return await request<Testimonial[]>("/testimonials", {
      revalidate: REVALIDATE_SECONDS,
    });
  } catch {
    return [];
  }
}

/**
 * The hero copy, About content, gallery, social links and session policy.
 * null when unreachable — callers fall back to the constants in site-nav.ts
 * for links and hide the editable sections.
 */
export async function getSiteContent(): Promise<SiteContent | null> {
  try {
    return await request<SiteContent>("/site-content", {
      revalidate: REVALIDATE_SECONDS,
    });
  } catch {
    return null;
  }
}
