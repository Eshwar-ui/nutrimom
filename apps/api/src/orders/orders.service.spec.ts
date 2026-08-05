import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { PaymentProvider } from '../payments/payment-provider.interface';

function makeService() {
  const tx = {
    order: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      // Defaults to a successful claim; a test that wants to simulate losing
      // the race overrides it with { count: 0 }.
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    listing: { updateMany: jest.fn() },
    shipment: {
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn(),
      // Defaults to "this order has no shipment rows yet" — the state an
      // admin-advanced order is in before any seller opens fulfilment.
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  };
  const notifications = { create: jest.fn() };
  const refund = jest.fn().mockResolvedValue({ refundId: 'rfnd_1' });
  const provider: PaymentProvider = {
    name: 'fake',
    keyId: 'fake_key',
    createOrder: jest.fn(),
    verifySignature: jest.fn(),
    parseWebhook: jest.fn(),
    refund,
  };
  const settings = {
    getCancellationPolicy: jest.fn().mockResolvedValue({
      cutoffHours: 24,
      reasonCodes: ['Changed my mind'],
      refundPercentage: 100,
      conditionDisputeHours: 48,
      updatedAt: new Date().toISOString(),
    }),
  };
  const payouts = {
    createForOrder: jest.fn(),
    cancelForOrder: jest.fn(),
    markPayableForOrder: jest.fn(),
  };
  const svc = new OrdersService(
    prisma as any,
    notifications as any,
    settings as any,
    payouts as any,
    provider,
  );
  return {
    svc,
    prisma,
    tx,
    notifications,
    provider,
    refund,
    settings,
    payouts,
  };
}

type ShipmentWrite = { data: { sellerId?: string; status: string } };

/** Typed view of what cascadeShipments wrote, so assertions stay type-safe. */
const shipmentWrites = (fn: jest.Mock): ShipmentWrite['data'][] =>
  (fn.mock.calls as unknown as [ShipmentWrite][]).map(([arg]) => arg.data);

describe('OrdersService — an admin advance carries shipments with it', () => {
  const paidOrder = (items: { sellerId: string }[]) => ({
    id: 'o1',
    buyerId: 'b1',
    orderNumber: 'NM-20260805-002',
    status: 'PAID',
    totalInPaise: 40000,
    shippingAddress: {},
    createdAt: new Date(),
    items: items.map((i, n) => ({
      ...i,
      listingId: `l${n}`,
      listingTitle: `Item ${n}`,
    })),
  });

  it('creates a shipment row for a seller who never opened fulfilment', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue(paidOrder([{ sellerId: 's1' }]));
    tx.order.update.mockResolvedValue({ ...paidOrder([]), status: 'SHIPPED' });
    tx.order.findUniqueOrThrow.mockResolvedValue({
      ...paidOrder([]),
      status: 'SHIPPED',
    });

    await svc.updateStatus('o1', { status: 'SHIPPED' });

    // Previously nothing was created — the order went SHIPPED while the
    // seller's Sales page still read "Awaiting label".
    expect(shipmentWrites(tx.shipment.create)).toContainEqual(
      expect.objectContaining({ sellerId: 's1', status: 'SHIPPED' }),
    );
  });

  it('covers every seller on a multi-seller order', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue(
      paidOrder([{ sellerId: 's1' }, { sellerId: 's2' }]),
    );
    tx.order.update.mockResolvedValue({ ...paidOrder([]), status: 'SHIPPED' });
    tx.order.findUniqueOrThrow.mockResolvedValue({
      ...paidOrder([]),
      status: 'SHIPPED',
    });

    await svc.updateStatus('o1', { status: 'SHIPPED' });

    expect(tx.shipment.create).toHaveBeenCalledTimes(2);
  });

  it('advances a shipment that is behind the order', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue(paidOrder([{ sellerId: 's1' }]));
    tx.order.update.mockResolvedValue({ ...paidOrder([]), status: 'SHIPPED' });
    tx.order.findUniqueOrThrow.mockResolvedValue({
      ...paidOrder([]),
      status: 'SHIPPED',
    });
    tx.shipment.findMany.mockResolvedValue([
      { id: 'sh1', sellerId: 's1', status: 'LABEL_GENERATED', shippedAt: null },
    ]);

    await svc.updateStatus('o1', { status: 'SHIPPED' });

    expect(tx.shipment.create).not.toHaveBeenCalled();
    expect(shipmentWrites(tx.shipment.update)).toContainEqual(
      expect.objectContaining({ status: 'SHIPPED' }),
    );
  });

  it('never drags a seller backwards', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue(paidOrder([{ sellerId: 's1' }]));
    tx.order.update.mockResolvedValue({ ...paidOrder([]), status: 'SHIPPED' });
    tx.order.findUniqueOrThrow.mockResolvedValue({
      ...paidOrder([]),
      status: 'SHIPPED',
    });
    // This seller has already delivered; the order-level move to SHIPPED
    // must not undo that.
    tx.shipment.findMany.mockResolvedValue([
      { id: 'sh1', sellerId: 's1', status: 'DELIVERED', shippedAt: new Date() },
    ]);

    await svc.updateStatus('o1', { status: 'SHIPPED' });

    expect(tx.shipment.update).not.toHaveBeenCalled();
    expect(tx.shipment.create).not.toHaveBeenCalled();
  });
});

describe('OrdersService — admin updateStatus transitions', () => {
  it('rejects an illegal transition', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'DELIVERED',
      items: [],
    });

    await expect(
      svc.updateStatus('o1', { status: 'PAID' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects PENDING straight to SHIPPED', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'PENDING',
      items: [],
    });

    await expect(
      svc.updateStatus('o1', { status: 'SHIPPED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancelling a PAID order releases listings, notifies the seller, and refunds', async () => {
    const { svc, tx, prisma, notifications, refund } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PAID',
      totalInPaise: 40000,
      razorpayPaymentId: 'pay_1',
      items: [{ listingId: 'l1', sellerId: 's1', listingTitle: 'Crib' }],
    });
    tx.order.update.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'CANCELLED',
      totalInPaise: 40000,
      razorpayPaymentId: 'pay_1',
      shippingAddress: {},
      createdAt: new Date(),
      items: [],
    });
    tx.listing.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.update.mockResolvedValue({});
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'CANCELLED',
      shippingAddress: {},
      createdAt: new Date(),
      items: [],
    });

    await svc.updateStatus('o1', {
      status: 'CANCELLED',
      reason: 'Changed my mind',
    });

    expect(tx.listing.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'l1',
        holdOrderId: 'o1',
        status: { in: ['RESERVED', 'SOLD'] },
      },
      data: {
        status: 'APPROVED',
        holdOrderId: null,
        reservedById: null,
        reservedUntil: null,
      },
    });
    expect(notifications.create).toHaveBeenCalledWith(
      's1',
      'ORDER_CANCELLED',
      expect.stringContaining('an admin'),
      'l1',
      'o1',
      tx,
    );
    expect(refund).toHaveBeenCalledWith('pay_1', 40000);
  });

  it('marking PENDING as PAID claims listings and notifies sellers', async () => {
    const { svc, tx, notifications } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'PENDING',
      items: [{ listingId: 'l1', sellerId: 's1', listingTitle: 'Crib' }],
    });
    tx.listing.updateMany.mockResolvedValue({ count: 1 });
    tx.order.update.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PAID',
      shippingAddress: {},
      createdAt: new Date(),
      items: [],
    });

    await svc.updateStatus('o1', { status: 'PAID' });

    expect(tx.listing.updateMany).toHaveBeenCalledWith({
      where: { id: 'l1', holdOrderId: 'o1' },
      data: { status: 'SOLD', reservedUntil: null },
    });
    expect(notifications.create).toHaveBeenCalledWith(
      's1',
      'ITEM_SOLD',
      expect.anything(),
      'l1',
      'o1',
      tx,
    );
  });

  it('refuses to mark PAID if a listing has lost its hold', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'PENDING',
      items: [{ listingId: 'l1', sellerId: 's1', listingTitle: 'Crib' }],
    });
    tx.listing.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      svc.updateStatus('o1', { status: 'PAID' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('OrdersService — buyer cancel', () => {
  const validReason = { reason: 'Changed my mind' };

  it('refuses to cancel once a seller has generated a shipping label', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PAID',
      createdAt: new Date(),
      items: [],
    });
    tx.shipment.count.mockResolvedValue(1);

    await expect(svc.cancel('b1', 'o1', validReason)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects cancelling someone else's order", async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'someone-else',
      status: 'PENDING',
      items: [],
    });

    await expect(svc.cancel('b1', 'o1', validReason)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects a reason not in the configured policy', async () => {
    const { svc } = makeService();

    await expect(
      svc.cancel('b1', 'o1', { reason: 'Not a real reason' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects cancelling outside the configured cutoff window', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h ago > 24h cutoff
      items: [],
    });

    await expect(svc.cancel('b1', 'o1', validReason)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('applies the policy refund percentage to a partial refund', async () => {
    const { svc, tx, prisma, refund, settings } = makeService();
    settings.getCancellationPolicy.mockResolvedValue({
      cutoffHours: 24,
      reasonCodes: ['Changed my mind'],
      refundPercentage: 50,
      conditionDisputeHours: 48,
      updatedAt: new Date().toISOString(),
    });
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PAID',
      totalInPaise: 40000,
      razorpayPaymentId: 'pay_1',
      createdAt: new Date(),
      items: [],
    });
    tx.order.update.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'CANCELLED',
      totalInPaise: 40000,
      razorpayPaymentId: 'pay_1',
      shippingAddress: {},
      createdAt: new Date(),
      items: [],
    });
    prisma.order.update.mockResolvedValue({});
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'CANCELLED',
      shippingAddress: {},
      createdAt: new Date(),
      items: [],
    });

    await svc.cancel('b1', 'o1', validReason);

    expect(refund).toHaveBeenCalledWith('pay_1', 20000);
  });
});

describe('OrdersService — buyer confirms delivery', () => {
  const shippedOrder = {
    id: 'o1',
    buyerId: 'b1',
    orderNumber: 'NM-20260805-001',
    status: 'SHIPPED',
    totalInPaise: 40000,
    shippingAddress: {},
    createdAt: new Date(),
    items: [{ listingId: 'l1', listingTitle: 'Pram', sellerId: 's1' }],
  };

  it('releases the seller payout from hold and notifies them', async () => {
    const { svc, tx, payouts, notifications } = makeService();
    tx.order.findUnique.mockResolvedValue(shippedOrder);
    tx.order.findUniqueOrThrow.mockResolvedValue({
      ...shippedOrder,
      status: 'DELIVERED',
    });

    const result = await svc.confirmDelivery('b1', 'o1');

    expect(result.status).toBe('DELIVERED');
    // Goes through cascadeShipments now, which also creates the row when a
    // seller never opened the fulfilment screen.
    expect(shipmentWrites(tx.shipment.create)).toContainEqual(
      expect.objectContaining({ sellerId: 's1', status: 'DELIVERED' }),
    );
    expect(payouts.markPayableForOrder).toHaveBeenCalledWith(tx, 'o1');
    expect(notifications.create).toHaveBeenCalledWith(
      's1',
      'ITEM_SOLD',
      expect.stringContaining('payout is now due'),
      'l1',
      'o1',
      tx,
    );
  });

  it("rejects confirming someone else's order", async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue(shippedOrder);

    await expect(
      svc.confirmDelivery('someone-else', 'o1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses to confirm an order that has not shipped', async () => {
    const { svc, tx, payouts } = makeService();
    tx.order.findUnique.mockResolvedValue({ ...shippedOrder, status: 'PAID' });

    await expect(svc.confirmDelivery('b1', 'o1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(payouts.markPayableForOrder).not.toHaveBeenCalled();
  });

  it('sends nothing when a concurrent confirmation won the transition', async () => {
    const { svc, tx, payouts, notifications } = makeService();
    tx.order.findUnique.mockResolvedValue(shippedOrder);
    // Both callers read SHIPPED; this one loses the conditional update. Without
    // the claim, each seller would get a duplicate "delivery confirmed" notice.
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(svc.confirmDelivery('b1', 'o1')).rejects.toThrow(
      'already marked delivered',
    );
    expect(notifications.create).not.toHaveBeenCalled();
    expect(payouts.markPayableForOrder).not.toHaveBeenCalled();
  });

  it('is not a way to re-trigger a payout on an already-delivered order', async () => {
    const { svc, tx, payouts } = makeService();
    tx.order.findUnique.mockResolvedValue({
      ...shippedOrder,
      status: 'DELIVERED',
    });

    await expect(svc.confirmDelivery('b1', 'o1')).rejects.toThrow(
      'already marked delivered',
    );
    expect(payouts.markPayableForOrder).not.toHaveBeenCalled();
  });
});
