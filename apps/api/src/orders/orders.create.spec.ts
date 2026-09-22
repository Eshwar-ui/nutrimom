import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { PaymentProvider } from '../payments/payment-provider.interface';

/**
 * Checkout — the point where a listing stops being available to anyone else.
 * It was the largest uncovered method in the service: the hold, the race
 * guard, server-side re-pricing and the sequential order number all ran
 * untested.
 */

const ADDRESS = {
  fullName: 'Asha Menon',
  phone: '9876543210',
  line1: '12 Nandi Durga Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560046',
  country: 'India',
};

function listing(over: Record<string, unknown> = {}) {
  return {
    id: 'l1',
    title: 'Wrap carrier',
    status: 'APPROVED',
    sellerId: 's1',
    sellingPriceInPaise: 120000,
    images: ['https://cdn.example.com/a.jpg'],
    ...over,
  };
}

/** The line each order item is created from. */
interface ItemCreate {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  unitPriceInPaise: number;
  image: string | null;
}

/** What `create()` hands to `tx.order.create`. */
interface OrderCreateArg {
  data: {
    buyerId: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    totalInPaise: number;
    shippingAddress: unknown;
    items: { create: ItemCreate[] };
  };
}

interface ListingClaim {
  where: { id: string; status: string };
  data: {
    status: string;
    reservedById: string;
    reservedUntil: Date;
    holdOrderId: string;
  };
}

/** First argument of the nth call, typed — keeps assertions off `any`. */
function callArg<T>(fn: jest.Mock, nth = 0): T {
  return (fn.mock.calls as unknown as [T][])[nth][0];
}

function makeService() {
  const tx = {
    listing: {
      findMany: jest.fn().mockResolvedValue([listing()]),
      // Defaults to winning the claim; a race test overrides with count: 0.
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    order: {
      create: jest.fn().mockImplementation((arg: OrderCreateArg) =>
        Promise.resolve({
          id: 'o1',
          orderNumber: arg.data.orderNumber,
          status: arg.data.status,
          paymentMethod: arg.data.paymentMethod,
          totalInPaise: arg.data.totalInPaise,
          shippingAddress: arg.data.shippingAddress,
          razorpayOrderId: null,
          refundedAt: null,
          createdAt: new Date('2026-08-11T10:00:00Z'),
          items: arg.data.items.create.map((item, n) => ({
            id: `oi${n}`,
            ...item,
          })),
        }),
      ),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ count: 7 }]),
  };

  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  };

  const provider: PaymentProvider = {
    name: 'fake',
    keyId: 'fake_key',
    createOrder: jest.fn(),
    verifySignature: jest.fn(),
    parseWebhook: jest.fn(),
    refund: jest.fn(),
  };

  const svc = new OrdersService(
    prisma as any,
    { create: jest.fn() } as any,
    { getCancellationPolicy: jest.fn() } as any,
    { createForOrder: jest.fn() } as any,
    provider,
  );
  return { svc, prisma, tx };
}

const input = (listingIds = ['l1']) => ({
  listingIds,
  shippingAddress: ADDRESS,
});

describe('OrdersService.create — availability', () => {
  it('refuses when a listing in the basket no longer exists', async () => {
    const { svc, tx } = makeService();
    // Two ids requested, one row comes back.
    tx.listing.findMany.mockResolvedValue([listing()]);

    await expect(svc.create('b1', input(['l1', 'gone']))).rejects.toThrow(
      BadRequestException,
    );
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it.each(['RESERVED', 'SOLD', 'PENDING', 'REJECTED'])(
    'refuses a listing that is %s, naming it',
    async (status) => {
      const { svc, tx } = makeService();
      tx.listing.findMany.mockResolvedValue([listing({ status })]);

      await expect(svc.create('b1', input())).rejects.toThrow(
        '"Wrap carrier" is no longer available',
      );
      expect(tx.order.create).not.toHaveBeenCalled();
    },
  );

  it('refuses to let a seller buy their own listing', async () => {
    const { svc, tx } = makeService();
    tx.listing.findMany.mockResolvedValue([listing({ sellerId: 'b1' })]);

    await expect(svc.create('b1', input())).rejects.toThrow(
      "You can't buy your own listing",
    );
  });

  it('de-duplicates repeated ids — each listing is a single unit', async () => {
    const { svc, tx } = makeService();

    await svc.create('b1', input(['l1', 'l1', 'l1']));

    const query = callArg<{ where: { id: { in: string[] } } }>(
      tx.listing.findMany,
    );
    expect(query.where.id.in).toEqual(['l1']);
  });
});

describe('OrdersService.create — pricing', () => {
  it('prices from the database, ignoring anything the client sent', async () => {
    const { svc, tx } = makeService();
    tx.listing.findMany.mockResolvedValue([
      listing({ id: 'l1', sellingPriceInPaise: 120000 }),
      listing({ id: 'l2', title: 'Cot', sellingPriceInPaise: 80000 }),
    ]);

    const order = await svc.create('b1', {
      ...input(['l1', 'l2']),
      // A tampered client could send these; they must not be honoured.
      totalInPaise: 1,
      paymentMethod: 'COD',
    } as any);

    expect(order.totalInPaise).toBe(200000);
  });

  it('snapshots title, price, seller and first image onto each line', async () => {
    // The order must survive the listing being edited or taken down later.
    const { svc, tx } = makeService();

    const order = await svc.create('b1', input());

    expect(order.items[0]).toMatchObject({
      listingId: 'l1',
      listingTitle: 'Wrap carrier',
      unitPriceInPaise: 120000,
      sellerId: 's1',
      image: 'https://cdn.example.com/a.jpg',
    });
    void tx;
  });

  it('stores a null image for a listing with no photos', async () => {
    const { svc, tx } = makeService();
    tx.listing.findMany.mockResolvedValue([listing({ images: [] })]);

    const order = await svc.create('b1', input());

    expect(order.items[0].image).toBeNull();
  });

  it('is always ONLINE and PENDING — payment method is not client-selectable', async () => {
    const { svc } = makeService();

    const order = await svc.create('b1', input());

    expect(order.paymentMethod).toBe('ONLINE');
    expect(order.status).toBe('PENDING');
  });
});

describe('OrdersService.create — the hold', () => {
  it('claims every listing conditionally on it still being APPROVED', async () => {
    const { svc, tx } = makeService();
    tx.listing.findMany.mockResolvedValue([
      listing({ id: 'l1' }),
      listing({ id: 'l2' }),
    ]);

    await svc.create('b1', input(['l1', 'l2']));

    expect(tx.listing.updateMany).toHaveBeenCalledTimes(2);
    const claims = (
      tx.listing.updateMany.mock.calls as unknown as [ListingClaim][]
    ).map(([arg]) => arg);
    for (const arg of claims) {
      // The status predicate is what makes the claim atomic — without it two
      // buyers could both "claim" the same row.
      expect(arg.where.status).toBe('APPROVED');
      expect(arg.data).toMatchObject({
        status: 'RESERVED',
        reservedById: 'b1',
        holdOrderId: 'o1',
      });
    }
  });

  it('sets a hold that expires, so an abandoned checkout frees the item', async () => {
    const { svc, tx } = makeService();
    const HOLD_MS = 30 * 60 * 1000;

    // Bounded both ways against the clock either side of the call: the
    // service stamps `Date.now() + HOLD` at its own moment, which is always
    // a little after ours, so a one-sided assertion is a flake waiting for a
    // slow scheduler.
    const before = Date.now();
    await svc.create('b1', input());
    const after = Date.now();

    const claim = callArg<ListingClaim>(tx.listing.updateMany);
    const heldUntil = claim.data.reservedUntil.getTime();
    expect(heldUntil).toBeGreaterThanOrEqual(before + HOLD_MS);
    expect(heldUntil).toBeLessThanOrEqual(after + HOLD_MS);
  });

  it('loses the race rather than double-selling the item', async () => {
    // Someone else claimed it between our read and our write. Throwing rolls
    // the whole transaction back — order included.
    const { svc, tx } = makeService();
    tx.listing.updateMany.mockResolvedValue({ count: 0 });

    await expect(svc.create('b1', input())).rejects.toThrow(
      '"Wrap carrier" is no longer available',
    );
  });

  it('abandons the whole basket when one of several items is lost', async () => {
    const { svc, tx } = makeService();
    tx.listing.findMany.mockResolvedValue([
      listing({ id: 'l1' }),
      listing({ id: 'l2', title: 'Cot' }),
    ]);
    tx.listing.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(svc.create('b1', input(['l1', 'l2']))).rejects.toThrow(
      '"Cot" is no longer available',
    );
  });

  it('runs the whole checkout in one transaction', async () => {
    const { svc, prisma } = makeService();

    await svc.create('b1', input());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('OrdersService.create — order number', () => {
  it('formats the number as NM-YYYYMMDD-NNN, zero-padded', async () => {
    const { svc } = makeService();

    const order = await svc.create('b1', input());

    expect(order.orderNumber).toMatch(/^NM-\d{8}-\d{3}$/);
    expect(order.orderNumber.endsWith('-007')).toBe(true);
  });

  it('uses today (UTC) as the date part', async () => {
    const { svc } = makeService();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const order = await svc.create('b1', input());

    expect(order.orderNumber).toBe(`NM-${today}-007`);
  });

  it('pads past 99 without truncating', async () => {
    const { svc, tx } = makeService();
    tx.$queryRaw.mockResolvedValue([{ count: 1234 }]);

    const order = await svc.create('b1', input());

    expect(order.orderNumber.endsWith('-1234')).toBe(true);
  });

  it('claims the number atomically, inside the checkout transaction', async () => {
    // A count()+1 read-then-write would hand two concurrent checkouts the
    // same number; this must be the single upsert statement.
    const { svc, tx } = makeService();

    await svc.create('b1', input());

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    const sql = callArg<string[]>(tx.$queryRaw).join('');
    expect(sql).toContain('ON CONFLICT');
    expect(sql).toContain('RETURNING');
  });
});
