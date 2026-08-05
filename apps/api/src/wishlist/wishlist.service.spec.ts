import { WishlistService } from './wishlist.service';

function makeService() {
  const prisma = {
    wishlistItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
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
