import { Injectable } from '@nestjs/common';
import type {
  BusinessProfile as BusinessProfileRow,
  CancellationPolicy as CancellationPolicyRow,
  PayoutPolicy as PayoutPolicyRow,
  Prisma,
} from '@prisma/client';
import type {
  BusinessProfile,
  BusinessProfileInput,
  CancellationPolicy,
  CancellationPolicyInput,
  PayoutPolicy,
  PayoutPolicyInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';

const POLICY_ID = 'global';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCancellationPolicy(): Promise<CancellationPolicy> {
    const row = await this.prisma.cancellationPolicy.findUniqueOrThrow({
      where: { id: POLICY_ID },
    });
    return toDto(row);
  }

  async updateCancellationPolicy(
    input: CancellationPolicyInput,
  ): Promise<CancellationPolicy> {
    const row = await this.prisma.cancellationPolicy.update({
      where: { id: POLICY_ID },
      data: input,
    });
    return toDto(row);
  }

  /**
   * The commission rate to snapshot onto a new payout. Takes an optional tx so
   * the rate is read inside the same transaction that settles the sale —
   * otherwise an admin editing the rate mid-settle could split one order's
   * sellers across two different rates.
   */
  async getPayoutPolicy(
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<PayoutPolicy> {
    const row = await tx.payoutPolicy.findUniqueOrThrow({
      where: { id: POLICY_ID },
    });
    return toPayoutDto(row);
  }

  async updatePayoutPolicy(input: PayoutPolicyInput): Promise<PayoutPolicy> {
    const row = await this.prisma.payoutPolicy.update({
      where: { id: POLICY_ID },
      data: input,
    });
    return toPayoutDto(row);
  }

  /** Public — the legal pages render these details and gate indexing on them. */
  async getBusinessProfile(): Promise<BusinessProfile> {
    const row = await this.prisma.businessProfile.findUniqueOrThrow({
      where: { id: POLICY_ID },
    });
    return toBusinessDto(row);
  }

  async updateBusinessProfile(
    input: BusinessProfileInput,
  ): Promise<BusinessProfile> {
    const row = await this.prisma.businessProfile.update({
      where: { id: POLICY_ID },
      data: {
        ...input,
        // Empty optional fields are absent, not blank strings.
        gstin: input.gstin?.trim() || null,
        cin: input.cin?.trim() || null,
      },
    });
    return toBusinessDto(row);
  }
}

function toBusinessDto(row: BusinessProfileRow): BusinessProfile {
  return {
    legalEntityName: row.legalEntityName,
    tradeName: row.tradeName,
    registeredAddress: row.registeredAddress,
    supportEmail: row.supportEmail,
    supportPhone: row.supportPhone,
    grievanceOfficerName: row.grievanceOfficerName,
    grievanceOfficerEmail: row.grievanceOfficerEmail,
    gstin: row.gstin,
    cin: row.cin,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPayoutDto(row: PayoutPolicyRow): PayoutPolicy {
  return {
    commissionBps: row.commissionBps,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDto(row: CancellationPolicyRow): CancellationPolicy {
  return {
    cutoffHours: row.cutoffHours,
    reasonCodes: row.reasonCodes,
    refundPercentage: row.refundPercentage,
    conditionDisputeHours: row.conditionDisputeHours,
    updatedAt: row.updatedAt.toISOString(),
  };
}
