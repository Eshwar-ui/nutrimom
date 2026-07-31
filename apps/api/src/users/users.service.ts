import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Role,
  AuthUser,
  AdminUser,
  AdminUserDetail,
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
      include: {
        _count: { select: { listings: true } },
        memberships: { orderBy: { expiresAt: 'desc' }, take: 1 },
      },
    });
    const now = new Date();
    return rows.map((u) => {
      const latest = u.memberships[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        city: u.city,
        isSellerVerified: u.isSellerVerified,
        sellerVerificationRequestedAt:
          u.sellerVerificationRequestedAt?.toISOString() ?? null,
        registrationPaidAt: u.registrationPaidAt?.toISOString() ?? null,
        membership: latest
          ? {
              plan: latest.plan,
              startsAt: latest.startsAt.toISOString(),
              expiresAt: latest.expiresAt.toISOString(),
              active: latest.expiresAt > now,
            }
          : null,
        listingCount: u._count.listings,
        createdAt: u.createdAt.toISOString(),
      };
    });
  }

  // Full profile plus recent activity on both sides of the marketplace — the
  // per-row admin list only has enough to triage, not to actually review one
  // person (contact details, order/listing/sale history).
  async adminGet(id: string): Promise<AdminUserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { listings: true } },
        memberships: { orderBy: { expiresAt: 'desc' }, take: 1 },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [recentListings, recentOrders, recentSales] = await Promise.all([
      this.prisma.listing.findMany({
        where: { sellerId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          sellingPriceInPaise: true,
          createdAt: true,
        },
      }),
      this.prisma.order.findMany({
        where: { buyerId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalInPaise: true,
          createdAt: true,
        },
      }),
      this.prisma.orderItem.findMany({
        where: { sellerId: id },
        orderBy: { order: { createdAt: 'desc' } },
        take: 10,
        select: {
          listingTitle: true,
          unitPriceInPaise: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const now = new Date();
    const latest = user.memberships[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      whatsappNumber: user.whatsappNumber,
      bio: user.bio,
      isSellerVerified: user.isSellerVerified,
      sellerVerificationRequestedAt:
        user.sellerVerificationRequestedAt?.toISOString() ?? null,
      registrationPaidAt: user.registrationPaidAt?.toISOString() ?? null,
      membership: latest
        ? {
            plan: latest.plan,
            startsAt: latest.startsAt.toISOString(),
            expiresAt: latest.expiresAt.toISOString(),
            active: latest.expiresAt > now,
          }
        : null,
      listingCount: user._count.listings,
      createdAt: user.createdAt.toISOString(),
      recentListings: recentListings.map((l) => ({
        id: l.id,
        title: l.title,
        status: l.status,
        sellingPriceInPaise: l.sellingPriceInPaise,
        createdAt: l.createdAt.toISOString(),
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalInPaise: o.totalInPaise,
        createdAt: o.createdAt.toISOString(),
      })),
      recentSales: recentSales.map((s) => ({
        orderId: s.order.id,
        orderNumber: s.order.orderNumber,
        orderStatus: s.order.status,
        listingTitle: s.listingTitle,
        unitPriceInPaise: s.unitPriceInPaise,
        createdAt: s.order.createdAt.toISOString(),
      })),
    };
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
      sellerVerificationRequestedAt:
        user.sellerVerificationRequestedAt?.toISOString() ?? null,
      registrationPaidAt: user.registrationPaidAt?.toISOString() ?? null,
    };
  }
}
