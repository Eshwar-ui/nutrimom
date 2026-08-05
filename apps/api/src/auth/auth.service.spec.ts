import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

function makeService() {
  const users = { findById: jest.fn(), toAuthUser: jest.fn() };
  const prisma = {
    user: { update: jest.fn() },
    passwordResetToken: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const mail = { sendPasswordReset: jest.fn() };
  const jwt = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn().mockResolvedValue('signed'),
  };
  const config = { get: () => 'secret' };
  const svc = new AuthService(
    users as any,
    prisma as any,
    mail as any,
    jwt as any,
    config as any,
  );
  return { svc, users, prisma, jwt };
}

describe('AuthService — refresh-token revocation', () => {
  it('issues new tokens when the version still matches', async () => {
    const { svc, users, jwt } = makeService();
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', tv: 3 });
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: 'CUSTOMER',
      tokenVersion: 3,
    });

    await expect(svc.refresh('tok')).resolves.toEqual({
      accessToken: 'signed',
      refreshToken: 'signed',
    });
  });

  it('rejects a token minted before the version was bumped', async () => {
    const { svc, users, jwt } = makeService();
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', tv: 2 });
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: 'CUSTOMER',
      tokenVersion: 3, // password reset / logout-all has since incremented
    });

    await expect(svc.refresh('tok')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token carrying no version at all', async () => {
    const { svc, users, jwt } = makeService();
    // A refresh token minted before `tv` existed. Waving these through as
    // "legacy" would leave revocation bypassable by anyone holding one —
    // the whole feature would read as protection while providing none.
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1' });
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: 'CUSTOMER',
      tokenVersion: 0,
    });

    await expect(svc.refresh('tok')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('bumps the version so every existing session dies', async () => {
    const { svc, prisma } = makeService();

    await expect(svc.revokeSessions('u1')).resolves.toEqual({ ok: true });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { tokenVersion: { increment: 1 } },
    });
  });

  it('stamps the current version onto tokens it issues', async () => {
    const { svc, users, jwt } = makeService();
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', tv: 7 });
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: 'CUSTOMER',
      tokenVersion: 7,
    });

    await svc.refresh('tok');

    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'u1', tv: 7 }) as object,
      expect.anything(),
    );
  });
});
