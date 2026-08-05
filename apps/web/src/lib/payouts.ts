import type {
  AdminPayout,
  BusinessProfile,
  BusinessProfileInput,
  MarkPayoutPaidInput,
  PayoutPolicy,
  PayoutPolicyInput,
  PayoutStatus,
  SellerPayout,
} from "@nutrimom/shared";
import { authedRequest } from "./api";

export interface PayoutSummary {
  onHoldInPaise: number;
  payableInPaise: number;
  paidInPaise: number;
}

export function getMyPayouts() {
  return authedRequest<SellerPayout[]>("/seller/payouts");
}

export function getMyPayoutSummary() {
  return authedRequest<PayoutSummary>("/seller/payouts/summary");
}

export function getAdminPayouts(status?: PayoutStatus) {
  return authedRequest<AdminPayout[]>(
    status ? `/admin/payouts?status=${status}` : "/admin/payouts",
  );
}

export function markPayoutPaid(id: string, body: MarkPayoutPaidInput) {
  return authedRequest<SellerPayout>(`/admin/payouts/${id}/pay`, {
    method: "POST",
    body,
  });
}

export function getBusinessProfileAdmin() {
  return authedRequest<BusinessProfile>("/business-profile");
}

export function updateBusinessProfile(body: BusinessProfileInput) {
  return authedRequest<BusinessProfile>("/admin/business-profile", {
    method: "PATCH",
    body,
  });
}

export function getPayoutPolicy() {
  return authedRequest<PayoutPolicy>("/admin/payout-policy");
}

export function updatePayoutPolicy(body: PayoutPolicyInput) {
  return authedRequest<PayoutPolicy>("/admin/payout-policy", {
    method: "PATCH",
    body,
  });
}
