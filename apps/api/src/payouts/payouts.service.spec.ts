import { BadRequestException, Logger } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { AdminPayoutsController } from './payouts.controller';

// The shape createForOrder writes. Typed so the assertions below read the
// real fields instead of poking at `any`.
interface UpsertArg {
  where: unknown;
  create: {
    orderId: string;
    sellerId: string;
    grossInPaise: number;
    commissionBps: number;
    commissionInPaise: number;
    netInPaise: number;
  };
  update: Record<string, unknown>;
}

function makeService(commissionBps = 1000) {
  const tx = {
    sellerPayout: {
      upsert: jest.fn<unknown, [UpsertArg]>(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
  };
  const prisma = {
    sellerPayout: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
  const settings = {
    getPayoutPolicy: jest.fn().mockResolvedValue({
      commissionBps,
      updatedAt: new Date().toISOString(),
    }),
  };
  const svc = new PayoutsService(prisma as any, settings as any);
  return { svc, prisma, tx, settings };
}

describe('PayoutsService — recording the debt', () => {
  it('creates one payout per seller, summing that seller’s lines', async () => {
    const { svc, tx } = makeService();

    await svc.createForOrder(tx as any, 'o1', [
      { sellerId: 's1', unitPriceInPaise: 100000 },
      { sellerId: 's2', unitPriceInPaise: 50000 },
      { sellerId: 's1', unitPriceInPaise: 20000 },
    ]);

    expect(tx.sellerPayout.upsert).toHaveBeenCalledTimes(2);
    const [first, second] = tx.sellerPayout.upsert.mock.calls.map(
      (c) => c[0].create,
    );
    expect(first).toMatchObject({
      sellerId: 's1',
      grossInPaise: 120000,
      commissionInPaise: 12000,
      netInPaise: 108000,
    });
    expect(second).toMatchObject({
      sellerId: 's2',
      grossInPaise: 50000,
      commissionInPaise: 5000,
      netInPaise: 45000,
    });
  });

  it('snapshots the rate so gross always equals commission + net', async () => {
    const { svc, tx } = makeService(550); // 5.5% against an odd amount

    await svc.createForOrder(tx as any, 'o1', [
      { sellerId: 's1', unitPriceInPaise: 33333 },
    ]);

    const { create } = tx.sellerPayout.upsert.mock.calls[0][0];
    expect(create.commissionBps).toBe(550);
    expect(create.commissionInPaise).toBe(1833); // round(33333 * 0.055)
    expect(create.commissionInPaise + create.netInPaise).toBe(
      create.grossInPaise,
    );
  });

  it('never restates an existing debt when settle runs twice', async () => {
    const { svc, tx } = makeService();

    await svc.createForOrder(tx as any, 'o1', [
      { sellerId: 's1', unitPriceInPaise: 100000 },
    ]);

    // The upsert's update branch is empty — a re-settle (verify + webhook both
    // reaching settle) must not overwrite an amount, least of all a paid one.
    expect(tx.sellerPayout.upsert.mock.calls[0][0].update).toEqual({});
  });
});

describe('PayoutsService — lifecycle', () => {
  it('cancels only payouts that have not been paid out', async () => {
    const { svc, tx } = makeService();

    await svc.cancelForOrder(tx as any, 'o1');

    expect(tx.sellerPayout.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'o1', status: { in: ['PENDING', 'PAYABLE'] } },
      data: { status: 'CANCELLED' },
    });
  });

  it('warns when an order is cancelled after money already went out', async () => {
    const { svc, tx } = makeService();
    tx.sellerPayout.count.mockResolvedValue(1);
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    await svc.cancelForOrder(tx as any, 'o1');

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('needs manual recovery'),
    );
  });

  it('only moves PENDING payouts to PAYABLE on delivery', async () => {
    const { svc, tx } = makeService();

    await svc.markPayableForOrder(tx as any, 'o1');

    expect(tx.sellerPayout.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'o1', status: 'PENDING' },
      data: { status: 'PAYABLE' },
    });
  });
});

describe('AdminPayoutsController — status filter', () => {
  function makeController() {
    const payouts = { listForAdmin: jest.fn().mockResolvedValue([]) };
    return {
      ctrl: new AdminPayoutsController(payouts as unknown as PayoutsService),
      payouts,
    };
  }

  it('accepts a real status', async () => {
    const { ctrl, payouts } = makeController();
    await ctrl.list('PAYABLE');
    expect(payouts.listForAdmin).toHaveBeenCalledWith('PAYABLE');
  });

  it('lists everything when no status is given', async () => {
    const { ctrl, payouts } = makeController();
    await ctrl.list(undefined);
    expect(payouts.listForAdmin).toHaveBeenCalledWith(undefined);
  });

  it('rejects a prototype key instead of 500ing on it', () => {
    const { ctrl, payouts } = makeController();
    // PayoutStatus is a plain object, so an `in` check would let
    // "constructor" through to Prisma, which fails as an unhandled 500.
    expect(() => ctrl.list('constructor')).toThrow(BadRequestException);
    expect(() => ctrl.list('toString')).toThrow(BadRequestException);
    expect(payouts.listForAdmin).not.toHaveBeenCalled();
  });

  it('rejects an unknown status', () => {
    const { ctrl } = makeController();
    expect(() => ctrl.list('BANANA')).toThrow(BadRequestException);
  });
});

describe('PayoutsService — marking paid', () => {
  it('refuses to pay a payout that is still on hold', async () => {
    const { svc, prisma } = makeService();
    prisma.sellerPayout.updateMany.mockResolvedValue({ count: 0 });
    prisma.sellerPayout.findUnique.mockResolvedValue({
      id: 'p1',
      status: 'PENDING',
    });

    await expect(
      svc.markPaid('p1', { reference: 'UTR123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to pay the same payout twice', async () => {
    const { svc, prisma } = makeService();
    prisma.sellerPayout.updateMany.mockResolvedValue({ count: 0 });
    prisma.sellerPayout.findUnique.mockResolvedValue({
      id: 'p1',
      status: 'PAID',
    });

    await expect(svc.markPaid('p1', { reference: 'UTR123' })).rejects.toThrow(
      'already been paid',
    );
  });

  it('records the transfer reference on a payable payout', async () => {
    const { svc, prisma } = makeService();
    prisma.sellerPayout.updateMany.mockResolvedValue({ count: 1 });
    prisma.sellerPayout.findUniqueOrThrow.mockResolvedValue({
      id: 'p1',
      orderId: 'o1',
      status: 'PAID',
      grossInPaise: 100000,
      commissionBps: 1000,
      commissionInPaise: 10000,
      netInPaise: 90000,
      reference: 'UTR123',
      paidAt: new Date('2026-08-05T00:00:00Z'),
      createdAt: new Date('2026-08-01T00:00:00Z'),
      order: { orderNumber: 'NM-20260801-001' },
    });

    const result = await svc.markPaid('p1', { reference: 'UTR123' });

    expect(prisma.sellerPayout.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', status: 'PAYABLE' } }),
    );
    expect(result).toMatchObject({
      status: 'PAID',
      reference: 'UTR123',
      netInPaise: 90000,
      orderNumber: 'NM-20260801-001',
    });
  });
});
