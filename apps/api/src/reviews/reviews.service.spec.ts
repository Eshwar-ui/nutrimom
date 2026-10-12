import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReviewsService } from './reviews.service';

function makeService() {
  const prisma = {
    order: { findUnique: jest.fn() },
    review: { create: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
  };
  const svc = new ReviewsService(prisma as any);
  return { svc, prisma };
}

const paidOrder = {
  id: 'o1',
  buyerId: 'b1',
  status: 'PAID',
  items: [
    { listingId: 'l1', listingTitle: 'Pram', sellerId: 's1' },
    { listingId: 'l2', listingTitle: 'Cot', sellerId: 's2' },
  ],
};

const validInput = { listingId: 'l1', rating: 5, comment: 'Lovely' };

describe('ReviewsService — who may review what', () => {
  it('attributes the review to the seller of that specific line', async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue(paidOrder);
    prisma.review.create.mockResolvedValue({
      id: 'r1',
      orderId: 'o1',
      listingId: 'l1',
      rating: 5,
      comment: 'Lovely',
      createdAt: new Date(),
    });

    const result = await svc.create('b1', 'o1', validInput);

    // An order can span sellers — the review must land on the seller of the
    // reviewed item, not on the first seller in the order.
    expect(prisma.review.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sellerId: 's1',
        listingId: 'l1',
      }) as object,
    });
    expect(result.listingTitle).toBe('Pram');
  });

  it("rejects reviewing someone else's order", async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue(paidOrder);

    await expect(
      svc.create('not-the-buyer', 'o1', validInput),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses to review an unpaid order', async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue({
      ...paidOrder,
      status: 'PENDING',
    });

    await expect(svc.create('b1', 'o1', validInput)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses to review a cancelled order', async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue({
      ...paidOrder,
      status: 'CANCELLED',
    });

    await expect(svc.create('b1', 'o1', validInput)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses to review an item that is not in the order', async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue(paidOrder);

    await expect(
      svc.create('b1', 'o1', { ...validInput, listingId: 'not-in-order' }),
    ).rejects.toThrow('not part of this order');
  });

  it('turns the unique-constraint clash into a plain "already reviewed"', async () => {
    const { svc, prisma } = makeService();
    prisma.order.findUnique.mockResolvedValue(paidOrder);
    prisma.review.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(svc.create('b1', 'o1', validInput)).rejects.toThrow(
      'already reviewed this item',
    );
  });
});

describe('ReviewsService — seller summary', () => {
  it('reports null rather than zero when a seller has no reviews', async () => {
    const { svc, prisma } = makeService();
    prisma.review.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: 0,
    });

    // A brand-new seller must not render as a 0-star seller.
    await expect(svc.summaryForSeller('s1')).resolves.toEqual({
      averageRating: null,
      reviewCount: 0,
    });
  });
});
