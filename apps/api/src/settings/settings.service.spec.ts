import { GUARDS_METADATA } from '@nestjs/common/constants';
import { SettingsService } from './settings.service';
import {
  AdminPayoutPolicyController,
  PayoutPolicyController,
} from './settings.controller';

function makeService() {
  const prisma = {
    payoutPolicy: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'global',
        commissionBps: 1000,
        updatedAt: new Date('2026-11-01T09:00:00.000Z'),
      }),
      update: jest.fn(),
    },
  };
  const svc = new SettingsService(prisma as any);
  return { svc, prisma };
}

describe('public payout policy', () => {
  it('publishes the commission rate from the global row', async () => {
    const { svc, prisma } = makeService();

    const result = await svc.getPublicPayoutPolicy();

    expect(prisma.payoutPolicy.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'global' },
    });
    expect(result).toEqual({ commissionBps: 1000 });
  });

  it('exposes the rate and nothing else (no admin updatedAt)', async () => {
    const { svc } = makeService();

    const result = await svc.getPublicPayoutPolicy();

    expect(Object.keys(result)).toEqual(['commissionBps']);
  });

  it('follows an admin edit rather than a cached figure', async () => {
    const { svc, prisma } = makeService();
    prisma.payoutPolicy.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'global',
      commissionBps: 550,
      updatedAt: new Date(),
    });

    await expect(svc.getPublicPayoutPolicy()).resolves.toEqual({
      commissionBps: 550,
    });
  });

  it('is served by an unguarded controller with no write route', () => {
    const controller = new PayoutPolicyController(
      makeService().svc,
    ) as unknown as Record<string, unknown>;

    // Public by design — no JwtAuthGuard/RolesGuard on the class.
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PayoutPolicyController),
    ).toBeUndefined();
    // Read-only: changing the rate stays on the admin controller.
    expect(controller.update).toBeUndefined();
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AdminPayoutPolicyController),
    ).toHaveLength(2);
  });
});
