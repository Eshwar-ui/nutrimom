import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import type { GeneratedLabel } from './shipping-provider.interface';

/**
 * Fulfilment is where a seller's parcel and their money meet: a label booked
 * twice is two AWBs for one box, and advancing an order to SHIPPED before every
 * seller has actually shipped tells the buyer something untrue. None of it had
 * a test — this service was at 0% coverage.
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

/** First argument of the nth call, typed — keeps assertions off `any`. */
function callArg<T>(fn: jest.Mock, nth = 0): T {
  return (fn.mock.calls as unknown as [T][])[nth][0];
}

interface ShipmentUpsert {
  update: { status: string };
  create: { orderId: string; sellerId: string; status: string };
}

function manualLabel(over: Partial<GeneratedLabel> = {}): GeneratedLabel {
  return {
    courier: 'Self-ship',
    trackingId: null,
    labelUrl: null,
    labelHtml: '<html>label</html>',
    ...over,
  };
}

function makeService(label: GeneratedLabel = manualLabel()) {
  const provider = {
    name: 'Self-ship',
    createLabel: jest.fn().mockResolvedValue(label),
  };

  const store = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        name: 'Seller One',
        city: 'Bengaluru',
        whatsappNumber: '9999999999',
      }),
    },
    shipment: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
  };

  const prisma = {
    ...store,
    $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) => cb(store)),
  };

  const svc = new ShippingService(prisma as any, provider);
  return { svc, prisma, store, provider };
}

/** An order row shaped the way generateLabel reads it. */
function order(over: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    orderNumber: 'NM-20260811-001',
    status: 'PAID',
    createdAt: new Date('2026-08-11T10:00:00Z'),
    shippingAddress: ADDRESS,
    buyer: { name: 'Buyer One' },
    items: [
      {
        sellerId: 's1',
        listingTitle: 'Wrap carrier',
        unitPriceInPaise: 120000,
        image: null,
      },
    ],
    ...over,
  };
}

describe('ShippingService — generateLabel guards', () => {
  it('404s an order that does not exist', async () => {
    const { svc, store } = makeService();
    store.order.findUnique.mockResolvedValue(null);

    await expect(svc.generateLabel('s1', 'nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('403s a seller with no items in the order', async () => {
    const { svc, store, provider } = makeService();
    store.order.findUnique.mockResolvedValue(order());

    await expect(svc.generateLabel('someone-else', 'o1')).rejects.toThrow(
      ForbiddenException,
    );
    // Nothing was booked with the courier on the way to the refusal.
    expect(provider.createLabel).not.toHaveBeenCalled();
  });

  it.each(['PENDING', 'CANCELLED'])(
    'refuses to label a %s order — payment is not confirmed',
    async (status) => {
      const { svc, store, provider } = makeService();
      store.order.findUnique.mockResolvedValue(order({ status }));

      await expect(svc.generateLabel('s1', 'o1')).rejects.toThrow(
        BadRequestException,
      );
      expect(provider.createLabel).not.toHaveBeenCalled();
    },
  );

  it.each(['PAID', 'SHIPPED', 'DELIVERED'])(
    'allows labelling a %s order',
    async (status) => {
      const { svc, store } = makeService();
      store.order.findUnique.mockResolvedValue(order({ status }));
      store.shipment.upsert.mockResolvedValue({
        id: 'sh1',
        status: 'LABEL_GENERATED',
      });

      await expect(svc.generateLabel('s1', 'o1')).resolves.toMatchObject({
        shipmentId: 'sh1',
      });
    },
  );
});

describe('ShippingService — generateLabel behaviour', () => {
  it('sends a per-seller courier reference, not the bare order number', async () => {
    // Two sellers on one order are two consignments; sending the order number
    // alone would collide, and an aggregator rejects a duplicate reference.
    const { svc, store, provider } = makeService();
    store.order.findUnique.mockResolvedValue(
      order({
        items: [
          {
            sellerId: 's1',
            listingTitle: 'A',
            unitPriceInPaise: 100,
            image: null,
          },
          {
            sellerId: 'seller-two',
            listingTitle: 'B',
            unitPriceInPaise: 200,
            image: null,
          },
        ],
      }),
    );
    store.shipment.upsert.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });

    await svc.generateLabel('seller-two', 'o1');

    const [labelOrder] = provider.createLabel.mock.calls[0] as [
      { reference: string; items: { title: string }[] },
    ];
    expect(labelOrder.reference).toBe('NM-20260811-001-er-two');
    expect(labelOrder.reference).not.toBe('NM-20260811-001');
  });

  it('puts only this seller’s items on the label', async () => {
    const { svc, store, provider } = makeService();
    store.order.findUnique.mockResolvedValue(
      order({
        items: [
          {
            sellerId: 's1',
            listingTitle: 'Mine',
            unitPriceInPaise: 100,
            image: null,
          },
          {
            sellerId: 's2',
            listingTitle: 'Theirs',
            unitPriceInPaise: 200,
            image: null,
          },
        ],
      }),
    );
    store.shipment.upsert.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });

    await svc.generateLabel('s1', 'o1');

    const [labelOrder] = provider.createLabel.mock.calls[0] as [
      { items: { title: string }[] },
    ];
    expect(labelOrder.items.map((i) => i.title)).toEqual(['Mine']);
  });

  it('falls back to a placeholder when the seller row is missing', async () => {
    const { svc, store, provider } = makeService();
    store.order.findUnique.mockResolvedValue(order());
    store.user.findUnique.mockResolvedValue(null);
    store.shipment.upsert.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });

    await svc.generateLabel('s1', 'o1');

    const [, seller] = provider.createLabel.mock.calls[0] as [
      unknown,
      { name: string; city: string | null },
    ];
    expect(seller).toEqual({
      name: 'Seller',
      city: null,
      whatsappNumber: null,
    });
  });

  it('re-renders a manual label rather than refusing, since it costs nothing', async () => {
    const { svc, store, provider } = makeService();
    store.order.findUnique.mockResolvedValue(order());
    // Manual provider stores no labelUrl, so a reprint falls through.
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
      courier: 'Self-ship',
      trackingId: null,
      labelUrl: null,
    });
    store.shipment.upsert.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });

    const result = await svc.generateLabel('s1', 'o1');

    expect(provider.createLabel).toHaveBeenCalledTimes(1);
    expect(result.labelHtml).toBe('<html>label</html>');
  });

  it('never books a second consignment when a courier AWB already exists', async () => {
    // The trap this guards: a seller hitting "print" twice would otherwise end
    // up with two AWBs for one parcel, and the aggregator rejects the
    // duplicate reference anyway.
    const { svc, store, provider } = makeService();
    store.order.findUnique.mockResolvedValue(order());
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
      courier: 'Shiprocket',
      trackingId: 'AWB123',
      labelUrl: 'https://labels.example.com/AWB123.pdf',
    });

    const result = await svc.generateLabel('s1', 'o1');

    expect(provider.createLabel).not.toHaveBeenCalled();
    expect(store.shipment.upsert).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      shipmentId: 'sh1',
      trackingId: 'AWB123',
      labelUrl: 'https://labels.example.com/AWB123.pdf',
      labelHtml: null,
    });
  });

  it.each(['SHIPPED', 'DELIVERED'])(
    'reprinting does not drag a %s shipment back to LABEL_GENERATED',
    async (status) => {
      const { svc, store } = makeService();
      store.order.findUnique.mockResolvedValue(order({ status: 'SHIPPED' }));
      store.shipment.findUnique.mockResolvedValue({
        id: 'sh1',
        status,
        courier: 'Self-ship',
        trackingId: null,
        labelUrl: null,
      });
      store.shipment.upsert.mockResolvedValue({ id: 'sh1', status });

      await svc.generateLabel('s1', 'o1');

      const arg = callArg<ShipmentUpsert>(store.shipment.upsert);
      expect(arg.update.status).toBe(status);
      // A brand-new row is always LABEL_GENERATED; only the update path guards.
      expect(arg.create.status).toBe('LABEL_GENERATED');
    },
  );

  it('creates a fresh shipment at LABEL_GENERATED for a first print', async () => {
    const { svc, store } = makeService();
    store.order.findUnique.mockResolvedValue(order());
    store.shipment.findUnique.mockResolvedValue(null);
    store.shipment.upsert.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });

    await svc.generateLabel('s1', 'o1');

    const arg = callArg<ShipmentUpsert>(store.shipment.upsert);
    expect(arg.create).toMatchObject({
      orderId: 'o1',
      sellerId: 's1',
      status: 'LABEL_GENERATED',
    });
    expect(arg.update.status).toBe('LABEL_GENERATED');
  });
});

describe('ShippingService — markShipped guards', () => {
  // Regression cover for the bug fixed in the seller QA pass: markShipped read
  // only the Shipment, so a missing order, an order the seller has no part in,
  // and a genuinely label-less one all returned the same 400 telling the seller
  // to generate a label for an order that was not theirs.
  it('404s a missing order rather than blaming a missing label', async () => {
    const { svc, store } = makeService();
    store.order.findUnique.mockResolvedValue(null);

    await expect(svc.markShipped('s1', 'nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('403s a seller with no items, rather than blaming a missing label', async () => {
    const { svc, store } = makeService();
    store.order.findUnique.mockResolvedValue({ items: [{ sellerId: 's1' }] });

    await expect(svc.markShipped('other', 'o1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('400s only when the order is genuinely label-less', async () => {
    const { svc, store } = makeService();
    store.order.findUnique.mockResolvedValue({ items: [{ sellerId: 's1' }] });
    store.shipment.findUnique.mockResolvedValue(null);

    await expect(svc.markShipped('s1', 'o1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refuses a shipment still sitting at PENDING', async () => {
    const { svc, store } = makeService();
    store.order.findUnique.mockResolvedValue({ items: [{ sellerId: 's1' }] });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'PENDING',
    });

    await expect(svc.markShipped('s1', 'o1')).rejects.toThrow(
      BadRequestException,
    );
    expect(store.shipment.update).not.toHaveBeenCalled();
  });
});

describe('ShippingService — markShipped advances the order', () => {
  /** Wires the post-transaction listSales read that markShipped returns from. */
  function withSalesRow(store: ReturnType<typeof makeService>['store']) {
    store.order.findMany.mockResolvedValue([
      {
        id: 'o1',
        orderNumber: 'NM-20260811-001',
        createdAt: new Date('2026-08-11T10:00:00Z'),
        shippingAddress: ADDRESS,
        items: [
          {
            sellerId: 's1',
            listingTitle: 'A',
            unitPriceInPaise: 100000,
            image: null,
          },
        ],
        shipments: [
          { status: 'SHIPPED', courier: 'Self-ship', trackingId: null },
        ],
        payouts: [
          {
            status: 'PENDING',
            grossInPaise: 100000,
            commissionInPaise: 10000,
            netInPaise: 90000,
            paidAt: null,
          },
        ],
      },
    ]);
  }

  it('advances a single-seller order to SHIPPED', async () => {
    const { svc, store } = makeService();
    store.order.findUnique
      // markShipped's own lookup
      .mockResolvedValueOnce({ items: [{ sellerId: 's1' }] })
      // maybeMarkOrderShipped's lookup
      .mockResolvedValueOnce({
        status: 'PAID',
        items: [{ sellerId: 's1' }],
        shipments: [{ sellerId: 's1', status: 'SHIPPED' }],
      });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });
    withSalesRow(store);

    await svc.markShipped('s1', 'o1');

    expect(store.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'SHIPPED' },
    });
  });

  it('leaves a two-seller order at PAID until the second seller ships', async () => {
    const { svc, store } = makeService();
    store.order.findUnique
      .mockResolvedValueOnce({
        items: [{ sellerId: 's1' }, { sellerId: 's2' }],
      })
      .mockResolvedValueOnce({
        status: 'PAID',
        items: [{ sellerId: 's1' }, { sellerId: 's2' }],
        shipments: [{ sellerId: 's1', status: 'SHIPPED' }],
      });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });
    withSalesRow(store);

    await svc.markShipped('s1', 'o1');

    expect(store.order.update).not.toHaveBeenCalled();
  });

  it('advances once the last seller ships', async () => {
    const { svc, store } = makeService();
    store.order.findUnique
      .mockResolvedValueOnce({
        items: [{ sellerId: 's1' }, { sellerId: 's2' }],
      })
      .mockResolvedValueOnce({
        status: 'PAID',
        items: [{ sellerId: 's1' }, { sellerId: 's2' }],
        shipments: [
          { sellerId: 's1', status: 'SHIPPED' },
          { sellerId: 's2', status: 'SHIPPED' },
        ],
      });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh2',
      status: 'LABEL_GENERATED',
    });
    withSalesRow(store);

    await svc.markShipped('s2', 'o1');

    expect(store.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'SHIPPED' },
    });
  });

  it('counts a DELIVERED seller as shipped', async () => {
    const { svc, store } = makeService();
    store.order.findUnique
      .mockResolvedValueOnce({
        items: [{ sellerId: 's1' }, { sellerId: 's2' }],
      })
      .mockResolvedValueOnce({
        status: 'PAID',
        items: [{ sellerId: 's1' }, { sellerId: 's2' }],
        shipments: [
          { sellerId: 's1', status: 'SHIPPED' },
          { sellerId: 's2', status: 'DELIVERED' },
        ],
      });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });
    withSalesRow(store);

    await svc.markShipped('s1', 'o1');

    expect(store.order.update).toHaveBeenCalled();
  });

  it('takes a per-order advisory lock before deciding', async () => {
    // Without it, two sellers finishing at once can each read the other as
    // unshipped and neither advances the order.
    const { svc, store } = makeService();
    store.order.findUnique
      .mockResolvedValueOnce({ items: [{ sellerId: 's1' }] })
      .mockResolvedValueOnce({
        status: 'PAID',
        items: [{ sellerId: 's1' }],
        shipments: [{ sellerId: 's1', status: 'SHIPPED' }],
      });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });
    withSalesRow(store);

    await svc.markShipped('s1', 'o1');

    expect(store.$executeRaw).toHaveBeenCalled();
  });

  it('does not re-advance an order that is already past PAID', async () => {
    const { svc, store } = makeService();
    store.order.findUnique
      .mockResolvedValueOnce({ items: [{ sellerId: 's1' }] })
      .mockResolvedValueOnce({
        status: 'DELIVERED',
        items: [{ sellerId: 's1' }],
        shipments: [{ sellerId: 's1', status: 'SHIPPED' }],
      });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'LABEL_GENERATED',
    });
    withSalesRow(store);

    await svc.markShipped('s1', 'o1');

    expect(store.order.update).not.toHaveBeenCalled();
  });

  it('is a no-op for a shipment already SHIPPED', async () => {
    const { svc, store } = makeService();
    store.order.findUnique.mockResolvedValueOnce({
      items: [{ sellerId: 's1' }],
    });
    store.shipment.findUnique.mockResolvedValue({
      id: 'sh1',
      status: 'SHIPPED',
    });
    withSalesRow(store);

    await svc.markShipped('s1', 'o1');

    expect(store.shipment.update).not.toHaveBeenCalled();
    expect(store.order.update).not.toHaveBeenCalled();
  });
});

describe('ShippingService — listSales', () => {
  const saleOrder = {
    id: 'o1',
    orderNumber: 'NM-20260811-001',
    createdAt: new Date('2026-08-11T10:00:00Z'),
    shippingAddress: ADDRESS,
    items: [
      {
        sellerId: 's1',
        listingTitle: 'Mine',
        unitPriceInPaise: 100000,
        image: 'a.jpg',
      },
      {
        sellerId: 's2',
        listingTitle: 'Theirs',
        unitPriceInPaise: 50000,
        image: 'b.jpg',
      },
    ],
    shipments: [] as unknown[],
    payouts: [] as unknown[],
  };

  it('shows the seller their own items only', async () => {
    const { svc, store } = makeService();
    store.order.findMany.mockResolvedValue([saleOrder]);

    const [sale] = await svc.listSales('s1');

    expect(sale.items).toHaveLength(1);
    expect(sale.items[0].title).toBe('Mine');
  });

  it('reports PENDING when no shipment row exists yet', async () => {
    const { svc, store } = makeService();
    store.order.findMany.mockResolvedValue([saleOrder]);

    const [sale] = await svc.listSales('s1');

    expect(sale.shipmentStatus).toBe('PENDING');
    expect(sale.courier).toBeNull();
    expect(sale.trackingId).toBeNull();
  });

  it('reports net, not gross, as what the seller is owed', async () => {
    // The page used to show the item sum as "payout total", with no commission
    // taken off — the seller was shown the marketplace's money as their own.
    const { svc, store } = makeService();
    store.order.findMany.mockResolvedValue([
      {
        ...saleOrder,
        payouts: [
          {
            status: 'PAYABLE',
            grossInPaise: 100000,
            commissionInPaise: 10000,
            netInPaise: 90000,
            paidAt: null,
          },
        ],
      },
    ]);

    const [sale] = await svc.listSales('s1');

    expect(sale.payout).toMatchObject({
      status: 'PAYABLE',
      grossInPaise: 100000,
      commissionInPaise: 10000,
      netInPaise: 90000,
    });
    expect(sale.payout!.netInPaise).toBeLessThan(sale.payout!.grossInPaise);
  });

  it('returns a null payout rather than inventing one', async () => {
    const { svc, store } = makeService();
    store.order.findMany.mockResolvedValue([saleOrder]);

    const [sale] = await svc.listSales('s1');

    expect(sale.payout).toBeNull();
  });

  it('asks only for orders that are paid onward and contain this seller', async () => {
    const { svc, store } = makeService();
    await svc.listSales('s1');

    const arg = callArg<{
      where: {
        status: { in: string[] };
        items: { some: { sellerId: string } };
      };
    }>(store.order.findMany);
    expect(arg.where.status.in).toEqual(['PAID', 'SHIPPED', 'DELIVERED']);
    expect(arg.where.items.some.sellerId).toBe('s1');
  });
});
