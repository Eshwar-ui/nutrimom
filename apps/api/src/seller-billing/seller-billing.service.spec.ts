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
        return { id: 'm1', ...(args.data as object) };
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
  const notifications = { notifyAdmins: jest.fn() };
  const mail = {
    sendSellerWelcome: jest.fn(),
    sendSubscriptionConfirmed: jest.fn(),
  };
  const svc = new SellerBillingService(
    prisma as any,
    notifications as any,
    mail as any,
    provider,
  );
  return { svc, tx, calls, notifications, mail };
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
      amountInPaise: 9900,
    });
    tx.sellerPayment.updateMany.mockResolvedValue({ count: 1 });

    await svc.handleWebhook(Buffer.from('{}'), 'sig');

    expect(calls).toEqual(['lock', 'findFirst', 'create']);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('stacks the new window onto the current expiry', async () => {
    const { svc, tx, mail } = makeService();
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
      amountInPaise: 9900,
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
    expect(mail.sendSubscriptionConfirmed).toHaveBeenCalledWith(
      'u1',
      'm1',
      9900,
    );
  });

  it('is idempotent — a second settle does not stack again', async () => {
    const { svc, tx, mail } = makeService();
    tx.sellerPayment.findUnique.mockResolvedValue({
      id: 'sp1',
      userId: 'u1',
      gatewayOrderId: 'gw_1',
      status: 'PAID',
      type: 'MEMBERSHIP',
      plan: 'MONTHLY',
      amountInPaise: 9900,
    });
    tx.sellerPayment.updateMany.mockResolvedValue({ count: 0 });

    await svc.handleWebhook(Buffer.from('{}'), 'sig');

    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.sellerMembership.create).not.toHaveBeenCalled();
    expect(mail.sendSubscriptionConfirmed).not.toHaveBeenCalled();
  });
});

describe('SellerBillingService — registration notifies admins', () => {
  it('notifies admins with the seller id once registration settles', async () => {
    const { svc, tx, notifications, mail } = makeService();
    tx.sellerPayment.findUnique.mockResolvedValue({
      id: 'sp1',
      userId: 'u1',
      gatewayOrderId: 'gw_1',
      status: 'PENDING',
      type: 'REGISTRATION',
      plan: null,
    });
    tx.sellerPayment.updateMany.mockResolvedValue({ count: 1 });
    tx.user.update.mockResolvedValue({ id: 'u1', name: 'Priya Sharma' });

    await svc.handleWebhook(Buffer.from('{}'), 'sig');

    expect(notifications.notifyAdmins).toHaveBeenCalledWith(
      'SELLER_REGISTERED',
      expect.stringContaining('Priya Sharma'),
      null,
      null,
      tx,
      'u1',
    );
    expect(mail.sendSellerWelcome).toHaveBeenCalledWith('u1');
  });

  it('does not notify again on an already-settled registration', async () => {
    const { svc, tx, notifications, mail } = makeService();
    tx.sellerPayment.findUnique.mockResolvedValue({
      id: 'sp1',
      userId: 'u1',
      gatewayOrderId: 'gw_1',
      status: 'PAID',
      type: 'REGISTRATION',
      plan: null,
    });
    tx.sellerPayment.updateMany.mockResolvedValue({ count: 0 });

    await svc.handleWebhook(Buffer.from('{}'), 'sig');

    expect(notifications.notifyAdmins).not.toHaveBeenCalled();
    expect(mail.sendSellerWelcome).not.toHaveBeenCalled();
  });
});
