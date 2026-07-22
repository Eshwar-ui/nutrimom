import { MEMBERSHIP_PLANS } from '@nutrimom/shared';
import { SellerBillingService } from './seller-billing.service';
import type { PaymentProvider } from '../payments/payment-provider.interface';

const DAY_MS = 24 * 60 * 60 * 1000;

function makeService() {
  const calls: string[] = [];
  const tx = {
    sellerPayment: { findUnique: jest.fn(), updateMany: jest.fn() },
    user: { update: jest.fn() },
    sellerMembership: {
      findFirst: jest.fn().mockImplementation(() => {
        calls.push('findFirst');
        return null;
      }),
      create: jest.fn().mockImplementation((args: { data: unknown }) => {
        calls.push('create');
        return args.data;
      }),
    },
    $executeRaw: jest.fn().mockImplementation(() => {
      calls.push('lock');
      return 1;
    }),
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  };
  const provider: PaymentProvider = {
    name: 'fake',
    keyId: 'fake_key',
    createOrder: jest.fn(),
    verifySignature: jest.fn().mockReturnValue(true),
    parseWebhook: jest.fn().mockReturnValue({
      settled: true,
      gatewayOrderId: 'gw_1',
      gatewayPaymentId: 'pay_1',
    }),
    refund: jest.fn(),
  };
  const svc = new SellerBillingService(prisma as any, provider);
  return { svc, tx, calls };
}

describe('SellerBillingService — membership stacking', () => {
  it('acquires the per-user advisory lock before reading the current window', async () => {
    const { svc, tx, calls } = makeService();
    tx.sellerPayment.findUnique.mockResolvedValue({
      id: 'sp1',
      userId: 'u1',
      gatewayOrderId: 'gw_1',
      status: 'PENDING',
      type: 'MEMBERSHIP',
      plan: 'MONTHLY',
    });
    tx.sellerPayment.updateMany.mockResolvedValue({ count: 1 });

    await svc.handleWebhook(Buffer.from('{}'), 'sig');

    expect(calls).toEqual(['lock', 'findFirst', 'create']);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('stacks the new window onto the current expiry', async () => {
    const { svc, tx } = makeService();
    const currentExpiry = new Date(Date.now() + 5 * DAY_MS);
    tx.sellerMembership.findFirst.mockResolvedValue({
      expiresAt: currentExpiry,
    });
    tx.sellerPayment.findUnique.mockResolvedValue({
      id: 'sp1',
      userId: 'u1',
      gatewayOrderId: 'gw_1',
      status: 'PENDING',
      type: 'MEMBERSHIP',
      plan: 'MONTHLY',
    });
    tx.sellerPayment.updateMany.mockResolvedValue({ count: 1 });

    await svc.handleWebhook(Buffer.from('{}'), 'sig');

    expect(tx.sellerMembership.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        plan: 'MONTHLY',
        startsAt: currentExpiry,
        expiresAt: new Date(
          currentExpiry.getTime() +
            MEMBERSHIP_PLANS.MONTHLY.durationDays * DAY_MS,
        ),
      },
    });
  });

  it('is idempotent — a second settle does not stack again', async () => {
    const { svc, tx } = makeService();
    tx.sellerPayment.findUnique.mockResolvedValue({
      id: 'sp1',
      userId: 'u1',
      gatewayOrderId: 'gw_1',
      status: 'PAID',
      type: 'MEMBERSHIP',
      plan: 'MONTHLY',
    });
    tx.sellerPayment.updateMany.mockResolvedValue({ count: 0 });

    await svc.handleWebhook(Buffer.from('{}'), 'sig');

    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.sellerMembership.create).not.toHaveBeenCalled();
  });
});
