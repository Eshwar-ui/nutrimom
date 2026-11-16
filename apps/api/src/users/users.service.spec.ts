import { BadRequestException } from '@nestjs/common';
import { profileUpdateSchema } from '@nutrimom/shared';
import { UsersService } from './users.service';

/** A mock's nth call's first argument, typed loosely enough to assert on. */
interface QueryArg {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
  orderBy: unknown;
  by: unknown;
}
function arg(fn: jest.Mock, nth = 0): QueryArg {
  return (fn.mock.calls as unknown as [QueryArg][])[nth][0];
}

function makeService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockReturnValue('user-update'),
    },
    donationOffer: {
      updateMany: jest.fn().mockReturnValue('donation-scrub'),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  return { svc: new UsersService(prisma as any), prisma };
}

describe('UsersService.deleteAccount — anonymisation', () => {
  it('scrubs the user row and the contact snapshots on their donation offers, together', async () => {
    const { svc, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'CUSTOMER',
      isSystemSeller: false,
      deletedAt: null,
    });
    await svc.deleteAccount('u1');

    // One transaction holding both writes: no state where the account is
    // gone but her name and phone are still in the donation queue.
    expect(prisma.$transaction).toHaveBeenCalledWith([
      'user-update',
      'donation-scrub',
    ]);

    const userData = arg(prisma.user.update).data;
    expect(userData).toMatchObject({
      email: 'deleted-u1@deleted.invalid',
      name: 'Deleted account',
      whatsappNumber: null,
      city: null,
      locality: null,
      pincode: null,
      bio: null,
    });
    expect(userData.deletedAt).toBeInstanceOf(Date);

    expect(prisma.donationOffer.updateMany).toHaveBeenCalledWith({
      where: { donorId: 'u1' },
      data: {
        contactName: 'Deleted account',
        contactEmail: 'deleted-u1@deleted.invalid',
        contactPhone: '',
      },
    });
  });

  it('is a no-op for an already-deleted account', async () => {
    const { svc, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'CUSTOMER',
      isSystemSeller: false,
      deletedAt: new Date(),
    });
    await svc.deleteAccount('u1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['an admin', { role: 'ADMIN', isSystemSeller: false }],
    ['the marketplace account', { role: 'CUSTOMER', isSystemSeller: true }],
  ])('refuses to delete %s', async (_label, flags) => {
    const { svc, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      deletedAt: null,
      ...flags,
    });
    await expect(svc.deleteAccount('u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('UsersService.updateProfile — location defaults', () => {
  it('leaves locality/PIN untouched when the client does not send them', async () => {
    const { svc, prisma } = makeService();
    await svc.updateProfile('u1', profileUpdateSchema.parse({ name: 'Asha' }));
    const data = arg(prisma.user.update).data;
    expect(data).not.toHaveProperty('locality');
    expect(data).not.toHaveProperty('pincode');
  });

  it('saves them when sent, and clears them on ""', async () => {
    const { svc, prisma } = makeService();
    await svc.updateProfile(
      'u1',
      profileUpdateSchema.parse({ locality: 'Baner', pincode: '411045' }),
    );
    await svc.updateProfile(
      'u1',
      profileUpdateSchema.parse({ locality: '', pincode: '' }),
    );
    expect(arg(prisma.user.update).data).toMatchObject({
      locality: 'Baner',
      pincode: '411045',
    });
    expect(arg(prisma.user.update, 1).data).toMatchObject({
      locality: null,
      pincode: null,
    });
  });

  it('rejects a malformed PIN', () => {
    expect(profileUpdateSchema.safeParse({ pincode: '012345' }).success).toBe(
      false,
    );
  });
});
