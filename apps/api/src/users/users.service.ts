import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Role,
  AuthUser,
  AdminUser,
  ProfileUpdateInput,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: Role;
  }) {
    return this.prisma.user.create({ data });
  }

  updateProfile(id: string, dto: ProfileUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        whatsappNumber: dto.whatsappNumber || null,
        city: dto.city || null,
        bio: dto.bio || null,
      },
    });
  }

  async adminList(): Promise<AdminUser[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { listings: true } } },
    });
    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      city: u.city,
      isSellerVerified: u.isSellerVerified,
      sellerVerificationRequestedAt: u.sellerVerificationRequestedAt?.toISOString() ?? null,
      listingCount: u._count.listings,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async verifySeller(id: string, isSellerVerified: boolean) {
    try {
      const u = await this.prisma.user.update({
        where: { id },
        // Approving (or rejecting) a request resolves it either way.
        data: { isSellerVerified, sellerVerificationRequestedAt: null },
      });
      return this.toAuthUser(u);
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async requestSellerVerification(id: string): Promise<AuthUser> {
    const u = await this.prisma.user.update({
      where: { id },
      data: { sellerVerificationRequestedAt: new Date() },
    });
    return this.toAuthUser(u);
  }

  // Strip passwordHash before anything leaves the service.
  toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      whatsappNumber: user.whatsappNumber,
      city: user.city,
      bio: user.bio,
      isSellerVerified: user.isSellerVerified,
      sellerVerificationRequestedAt: user.sellerVerificationRequestedAt?.toISOString() ?? null,
    };
  }
}
