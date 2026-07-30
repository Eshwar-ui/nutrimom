import { Injectable } from '@nestjs/common';
import type { CancellationPolicy as CancellationPolicyRow } from '@prisma/client';
import type {
  CancellationPolicy,
  CancellationPolicyInput,
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
}

function toDto(row: CancellationPolicyRow): CancellationPolicy {
  return {
    cutoffHours: row.cutoffHours,
    reasonCodes: row.reasonCodes,
    refundPercentage: row.refundPercentage,
    updatedAt: row.updatedAt.toISOString(),
  };
}
