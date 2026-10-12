import { createHmac } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
  const payouts = { createForOrder: jest.fn() };
  const svc = new PaymentsService(
    prisma as any,
    orders as any,
    notifications as any,
    payouts as any,
    provider,
  );
  return { svc, prisma, tx, orders, notifications, provider, refund, payouts };
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
      null,
      'o1',
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
      null,
      'o1',
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

/**
 * Creating the gateway order is where a retry can quietly go wrong: mint a
 * second gateway order for the same internal order and any payment made
 * against the first one matches nothing by the time it reaches settle().
 * Verified live during the Razorpay pass, but never in CI until now.
 */
describe('PaymentsService — createGatewayOrder', () => {
  const pendingOrder = (over: Record<string, unknown> = {}) => ({
    id: 'o1',
    buyerId: 'b1',
    status: 'PENDING',
    totalInPaise: 120000,
    razorpayOrderId: null,
    ...over,
  });

  it('mints a gateway order and records its id against the order', async () => {
    const { svc, prisma, provider } = makeService();
    prisma.order.findUnique.mockResolvedValue(pendingOrder());
    const createOrder = jest.spyOn(provider, 'createOrder').mockResolvedValue({
      gatewayOrderId: 'order_abc',
      currency: 'INR',
      keyId: 'kid',
    });

    const result = await svc.createGatewayOrder('b1', 'o1');

    expect(createOrder).toHaveBeenCalledWith(120000, 'o1');
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { razorpayOrderId: 'order_abc' },
    });
    expect(result).toMatchObject({
      orderId: 'o1',
      razorpayOrderId: 'order_abc',
      amountInPaise: 120000,
      currency: 'INR',
      keyId: 'kid',
    });
  });

  it('reuses an open gateway order on retry instead of minting a second', async () => {
    const { svc, prisma, provider } = makeService();
    prisma.order.findUnique.mockResolvedValue(
      pendingOrder({ razorpayOrderId: 'order_existing' }),
    );
    const createOrder = jest.spyOn(provider, 'createOrder');

    const result = await svc.createGatewayOrder('b1', 'o1');

    expect(createOrder).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(result.razorpayOrderId).toBe('order_existing');
  });

  it('quotes the amount from the order, never from the caller', async () => {
    const { svc, prisma, provider } = makeService();
    prisma.order.findUnique.mockResolvedValue(
      pendingOrder({ razorpayOrderId: 'order_existing', totalInPaise: 999 }),
    );
    jest.spyOn(provider, 'createOrder');

    const result = await svc.createGatewayOrder('b1', 'o1');

    expect(result.amountInPaise).toBe(999);
    expect(result.currency).toBe('INR');
  });

  it('404s an order that does not exist', async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(svc.createGatewayOrder('b1', 'nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("403s another buyer's order", async () => {
    const { svc, prisma, provider } = makeService();
    prisma.order.findUnique.mockResolvedValue(pendingOrder({ buyerId: 'b2' }));
    const createOrder = jest.spyOn(provider, 'createOrder');

    await expect(svc.createGatewayOrder('b1', 'o1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(createOrder).not.toHaveBeenCalled();
  });

  it.each(['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'])(
    'refuses to open a payment on a %s order',
    async (status) => {
      const { svc, prisma, provider } = makeService();
      prisma.order.findUnique.mockResolvedValue(pendingOrder({ status }));
      const createOrder = jest.spyOn(provider, 'createOrder');

      await expect(svc.createGatewayOrder('b1', 'o1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(createOrder).not.toHaveBeenCalled();
    },
  );
});
