import type { Metadata } from "next";
import {
  isBusinessProfileComplete,
  type BusinessProfile,
} from "@nutrimom/shared";
import { request } from "./api";

/**
 * The operator's business identity, read server-side by the legal pages.
 *
 * Short revalidate window rather than the hour these details actually change
 * on: this value decides whether the legal pages are published at all, and
 * the minute after an admin completes (or clears) the profile is exactly when
 * someone checks whether it took effect. These pages get little traffic, so
 * the extra requests cost nothing.
 *
 * Returns null if the API is unreachable, which deliberately reads the same
 * as "not filled in": a legal page must never publish itself because a fetch
 * failed.
 */
export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  try {
    return await request<BusinessProfile>("/business-profile", {
      revalidate: 60,
    });
  } catch {
    return null;
  }
}

/**
 * Metadata for a legal page. A policy page that doesn't yet name a real
 * entity, address and grievance officer isn't compliant, so it stays out of
 * the index until the profile is complete.
 */
export async function legalMetadata(title: string): Promise<Metadata> {
  const profile = await getBusinessProfile();
  const publishable = isBusinessProfileComplete(profile);
  return {
    title,
    robots: publishable ? undefined : { index: false, follow: false },
  };
}
