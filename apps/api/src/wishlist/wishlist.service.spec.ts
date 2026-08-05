import { NotFoundException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

function makeService() {
  const prisma = {
    wishlistItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      // Resolves by default — toggle() chains .catch() onto the create to
      // turn a stale listing id into a 404, so the mock has to be thenable.
      create: jest.fn().mockResolvedValue({ id: 'w1' }),
      delete: jest.fn().mockResolvedValue({ id: 'w1' }),
    },
  };
  const svc = new WishlistService(prisma as any);
  return { svc, prisma };
}

describe('WishlistService — toggle', () => {
  it('adds the listing when it is not already wishlisted', async () => {
    const { svc, prisma } = makeService();
    prisma.wishlistItem.findUnique.mockResolvedValue(null);

    await expect(svc.toggle('u1', 'l1')).resolves.toEqual({ wishlisted: true });
    expect(prisma.wishlistItem.create).toHaveBeenCalledWith({
      data: { userId: 'u1', listingId: 'l1' },
    });
    expect(prisma.wishlistItem.delete).not.toHaveBeenCalled();
  });

  it('removes it when it is already wishlisted', async () => {
    const { svc, prisma } = makeService();
    prisma.wishlistItem.findUnique.mockResolvedValue({ id: 'w1' });

    await expect(svc.toggle('u1', 'l1')).resolves.toEqual({
      wishlisted: false,
    });
    expect(prisma.wishlistItem.delete).toHaveBeenCalledWith({
      where: { id: 'w1' },
    });
    expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
  });

  it('404s a listing that no longer exists instead of throwing a 500', async () => {
    const { svc, prisma } = makeService();
    prisma.wishlistItem.findUnique.mockResolvedValue(null);
    // Foreign-key violation: the shop page was open when the item was
    // deleted or taken down, and the client sent a stale id.
    prisma.wishlistItem.create.mockRejectedValue(
      Object.assign(new Error('fk'), { code: 'P2003' }),
    );

    await expect(svc.toggle('u1', 'gone')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not disguise an unrelated database failure as a missing listing', async () => {
    const { svc, prisma } = makeService();
    prisma.wishlistItem.findUnique.mockResolvedValue(null);
    prisma.wishlistItem.create.mockRejectedValue(
      Object.assign(new Error('connection lost'), { code: 'P1001' }),
    );

    await expect(svc.toggle('u1', 'l1')).rejects.not.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('scopes the lookup to the acting user, not just the listing', async () => {
    const { svc, prisma } = makeService();
    prisma.wishlistItem.findUnique.mockResolvedValue(null);

    await svc.toggle('u1', 'l1');

    // Keyed on the (user, listing) pair — otherwise one user's toggle would
    // read, and then delete, another user's wishlist row.
    expect(prisma.wishlistItem.findUnique).toHaveBeenCalledWith({
      where: { userId_listingId: { userId: 'u1', listingId: 'l1' } },
    });
  });
});

describe('WishlistService — ids', () => {
  it('returns only this user’s listing ids', async () => {
    const { svc, prisma } = makeService();
    prisma.wishlistItem.findMany.mockResolvedValue([
      { listingId: 'l1' },
      { listingId: 'l2' },
    ]);

    await expect(svc.ids('u1')).resolves.toEqual(['l1', 'l2']);
    expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      select: { listingId: true },
    });
  });
});
