import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { PaymentProvider } from '../payments/payment-provider.interface';

function makeService() {
  const tx = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    listing: { updateMany: jest.fn() },
    shipment: { count: jest.fn().mockResolvedValue(0) },
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
  const svc = new OrdersService(prisma as any, notifications as any, provider);
  return { svc, prisma, tx, notifications, provider, refund };
}

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

    await svc.updateStatus('o1', { status: 'CANCELLED' });

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
  it('refuses to cancel once a seller has generated a shipping label', async () => {
    const { svc, tx } = makeService();
    tx.order.findUnique.mockResolvedValue({
      id: 'o1',
      buyerId: 'b1',
      status: 'PAID',
      items: [],
    });
    tx.shipment.count.mockResolvedValue(1);

    await expect(svc.cancel('b1', 'o1')).rejects.toBeInstanceOf(
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

    await expect(svc.cancel('b1', 'o1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
