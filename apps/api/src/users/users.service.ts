import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
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
        // Only when sent: a client that doesn't know these fields (the
        // mobile app's profile screen) must not wipe the seller's defaults.
        ...(dto.locality !== undefined
          ? { locality: dto.locality || null }
          : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode || null } : {}),
      },
    });
  }

  /**
   * Fulfil an authenticated account-deletion request without breaking order,
   * payout, or listing foreign keys. Personal fields are removed, the login
   * identity is replaced with a unique tombstone address, and all refresh
   * tokens are revoked through tokenVersion.
   */
  async deleteAccount(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isSystemSeller: true, deletedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN' || user.isSystemSeller) {
      throw new BadRequestException(
        'This account cannot be deleted from the customer app.',
      );
    }
    if (user.deletedAt) return;

    const tombstoneEmail = `deleted-${id}@deleted.invalid`;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: {
          email: tombstoneEmail,
          passwordHash: randomBytes(48).toString('hex'),
          name: 'Deleted account',
          whatsappNumber: null,
          city: null,
          locality: null,
          pincode: null,
          bio: null,
          isSellerVerified: false,
          sellerVerificationRequestedAt: null,
          registrationPaidAt: null,
          tokenVersion: { increment: 1 },
          deletedAt: new Date(),
        },
      }),
      // Donation offers keep a snapshot of the contact details the donor
      // typed, separate from the user row — scrub those too, or the account
      // is "deleted" while her name, email and phone sit in the admin queue.
      // The offer itself stays (the admin may be mid-match); the columns are
      // required, so they get the same tombstone values rather than null.
      this.prisma.donationOffer.updateMany({
        where: { donorId: id },
        data: {
          contactName: 'Deleted account',
          contactEmail: tombstoneEmail,
          contactPhone: '',
        },
      }),
    ]);
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
        isSystemSeller: u.isSystemSeller,
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
      isSystemSeller: user.isSystemSeller,
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
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { isSystemSeller: true },
    });
    if (!existing) throw new NotFoundException('User not found');
    // The marketplace's own account isn't a seller under review, and
    // un-verifying it used to break admin listing creation outright.
    if (existing.isSystemSeller) {
      throw new BadRequestException(
        "The Marketplace account is the platform's own seller and can't be verified or unverified.",
      );
    }

    const u = await this.prisma.user.update({
      where: { id },
      // Approving (or rejecting) a request resolves it either way.
      data: { isSellerVerified, sellerVerificationRequestedAt: null },
    });
    return this.toAuthUser(u);
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
      locality: user.locality,
      pincode: user.pincode,
    };
  }
}
