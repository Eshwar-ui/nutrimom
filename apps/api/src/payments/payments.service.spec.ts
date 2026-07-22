import { createHmac } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RazorpayProvider } from './providers/razorpay.provider';

const KEY_SECRET = 'secret';
const WEBHOOK_SECRET = 'whsec';

function sign(orderId: string, paymentId: string) {
  return createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function makeService() {
  const tx = {
    order: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    listing: { updateMany: jest.fn() },
  };
  const prisma = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  };
  const orders = {
    getMine: jest.fn().mockResolvedValue({ id: 'o1', status: 'PAID' }),
  };
  const notifications = { create: jest.fn(), notifyAdmins: jest.fn() };
  const config = {
    get: (k: string) =>
      ({
        RAZORPAY_KEY_ID: 'kid',
        RAZORPAY_KEY_SECRET: KEY_SECRET,
        RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
      })[k],
  };
  // Real Razorpay adapter so the signature/webhook HMAC path is genuinely
  // exercised through the gateway-agnostic PaymentProvider interface. Only
  // `refund` is stubbed — it would otherwise make a real network call.
  const provider = new RazorpayProvider(config as any);
  const refund = jest
    .spyOn(provider, 'refund')
    .mockResolvedValue({ refundId: 'rfnd_1' });
  const svc = new PaymentsService(
    prisma as any,
    orders as any,
    notifications as any,
    provider,
  );
  return { svc, prisma, tx, orders, notifications, provider, refund };
}

describe('PaymentsService — money path', () => {
  it('rejects a tampered payment signature', async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      razorpayOrderId: 'rzp_1',
      status: 'PENDING',
    });
    await expect(
      svc.verify('b1', {
        orderId: 'o1',
        razorpayOrderId: 'rzp_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'forged',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks listings SOLD and notifies on a valid signature', async () => {
    const { svc, prisma, tx, notifications } = makeService();
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      razorpayOrderId: 'rzp_1',
      status: 'PENDING',
    });
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'PENDING',
      items: [{ listingId: 'l1', sellerId: 's1', listingTitle: 'Crib' }],
    });
    tx.order.updateMany.mockResolvedValue({ count: 1 });
    tx.listing.updateMany.mockResolvedValue({ count: 1 });

    const res = await svc.verify('b1', {
      orderId: 'o1',
      razorpayOrderId: 'rzp_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: sign('rzp_1', 'pay_1'),
    });

    expect(tx.listing.updateMany).toHaveBeenCalledWith({
      where: { id: 'l1', holdOrderId: 'o1' },
      data: { status: 'SOLD', reservedUntil: null },
    });
    expect(notifications.create).toHaveBeenCalled();
    expect(res.status).toBe('PAID');
  });

  it('refunds and cancels the order if the hold was lost before settlement', async () => {
    const { svc, tx, prisma, notifications, refund } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PENDING',
      totalInPaise: 50000,
      items: [{ listingId: 'l1', sellerId: 's1', listingTitle: 'Crib' }],
    });
    tx.order.updateMany.mockResolvedValue({ count: 1 });
    tx.order.update.mockResolvedValue({});
    tx.listing.updateMany.mockResolvedValue({ count: 0 });
    prisma.order.update.mockResolvedValue({});

    const body = Buffer.from(
      JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { order_id: 'rzp_1', id: 'pay_1', amount: 50000 },
          },
        },
      }),
    );
    const webhookSig = createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    await svc.handleWebhook(body, webhookSig);

    expect(notifications.create).not.toHaveBeenCalledWith(
      's1',
      'ITEM_SOLD',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'CANCELLED', razorpayPaymentId: 'pay_1' },
    });
    expect(refund).toHaveBeenCalledWith('pay_1', 50000);
    expect(notifications.create).toHaveBeenCalledWith(
      'b1',
      'PAYMENT_REFUNDED',
      expect.stringContaining('refunded'),
    );
  });

  it('is idempotent — a second settle does not re-sell listings', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'PAID',
      items: [{ listingId: 'l1', sellerId: 's1', listingTitle: 'Crib' }],
    });
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    const body = Buffer.from(
      JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { order_id: 'rzp_1', id: 'pay_1' } } },
      }),
    );
    const webhookSig = createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    await svc.handleWebhook(body, webhookSig);
    expect(tx.listing.updateMany).not.toHaveBeenCalled();
  });

  it('refunds a payment captured against an order the buyer already cancelled', async () => {
    const { svc, tx, prisma, notifications, refund } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'CANCELLED',
      totalInPaise: 50000,
      items: [],
    });
    prisma.order.update.mockResolvedValue({});

    const body = Buffer.from(
      JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { order_id: 'rzp_1', id: 'pay_1', amount: 50000 },
          },
        },
      }),
    );
    const webhookSig = createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    await svc.handleWebhook(body, webhookSig);

    expect(tx.order.updateMany).not.toHaveBeenCalled();
    expect(refund).toHaveBeenCalledWith('pay_1', 50000);
    expect(notifications.create).toHaveBeenCalledWith(
      'b1',
      'PAYMENT_REFUNDED',
      expect.stringContaining('refunded'),
    );
  });

  it('holds for manual reconciliation instead of settling on a captured-amount mismatch', async () => {
    const { svc, tx, refund } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PENDING',
      totalInPaise: 50000,
      items: [{ listingId: 'l1', sellerId: 's1', listingTitle: 'Crib' }],
    });

    const body = Buffer.from(
      JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: { entity: { order_id: 'rzp_1', id: 'pay_1', amount: 1 } },
        },
      }),
    );
    const webhookSig = createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    await svc.handleWebhook(body, webhookSig);

    expect(tx.order.updateMany).not.toHaveBeenCalled();
    expect(refund).not.toHaveBeenCalled();
  });

  it('rejects a webhook with a bad signature', async () => {
    const { svc } = makeService();
    const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    await expect(svc.handleWebhook(body, 'wrong')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
