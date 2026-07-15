import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MEMBERSHIP_PLANS,
  REGISTRATION_FEE_PAISE,
  type MembershipPlan,
  type SellerBillingStatus,
  type SellerCheckoutResponse,
  type VerifySellerPaymentInput,
} from '@nutrimom/shared';
import type { SellerPaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '../payments/payment-provider.interface';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SellerBillingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /** Current billing state — drives the Sell-page gate and account UI. */
  async status(userId: string): Promise<SellerBillingStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { registrationPaidAt: true },
    });
    const active = await this.activeMembership(userId);
    const registrationPaid = !!user?.registrationPaidAt;
    return {
      registrationPaid,
      registrationFeePaise: REGISTRATION_FEE_PAISE,
      activePlan: active?.plan ?? null,
      membershipExpiresAt: active?.expiresAt.toISOString() ?? null,
      canList: registrationPaid && !!active,
    };
  }

  /** Start the one-time ₹100 registration payment. */
  async registrationCheckout(userId: string): Promise<SellerCheckoutResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { registrationPaidAt: true },
    });
    if (user?.registrationPaidAt) {
      throw new BadRequestException('Seller registration is already paid');
    }
    return this.createCheckout(userId, 'REGISTRATION', null, REGISTRATION_FEE_PAISE);
  }

  /** Start a membership plan payment. Registration must be paid first. */
  async membershipCheckout(
    userId: string,
    plan: MembershipPlan,
  ): Promise<SellerCheckoutResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { registrationPaidAt: true },
    });
    if (!user?.registrationPaidAt) {
      throw new BadRequestException(
        'Complete the one-time seller registration before subscribing to a plan',
      );
    }
    const info = MEMBERSHIP_PLANS[plan];
    return this.createCheckout(userId, 'MEMBERSHIP', plan, info.priceInPaise);
  }

  async verify(
    userId: string,
    input: VerifySellerPaymentInput,
  ): Promise<SellerBillingStatus> {
    const payment = await this.prisma.sellerPayment.findUnique({
      where: { id: input.sellerPaymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.userId !== userId) throw new ForbiddenException();
    if (payment.gatewayOrderId !== input.razorpayOrderId) {
      throw new BadRequestException('Payment order mismatch');
    }
    const valid = this.provider.verifySignature({
      gatewayOrderId: input.razorpayOrderId,
      gatewayPaymentId: input.razorpayPaymentId,
      signature: input.razorpaySignature,
    });
    if (!valid) throw new BadRequestException('Invalid payment signature');

    await this.settle(input.razorpayOrderId, input.razorpayPaymentId);
    return this.status(userId);
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const event = this.provider.parseWebhook(rawBody, signature);
    if (event.settled && event.gatewayOrderId && event.gatewayPaymentId) {
      await this.settle(event.gatewayOrderId, event.gatewayPaymentId);
    }
    return { received: true };
  }

  private async createCheckout(
    userId: string,
    type: SellerPaymentType,
    plan: MembershipPlan | null,
    amountInPaise: number,
  ): Promise<SellerCheckoutResponse> {
    const payment = await this.prisma.sellerPayment.create({
      data: { userId, type, plan, amountInPaise, status: 'PENDING' },
    });
    const gateway = await this.provider.createOrder(amountInPaise, payment.id);
    await this.prisma.sellerPayment.update({
      where: { id: payment.id },
      data: { gatewayOrderId: gateway.gatewayOrderId },
    });
    return {
      sellerPaymentId: payment.id,
      razorpayOrderId: gateway.gatewayOrderId,
      amountInPaise,
      currency: gateway.currency,
      keyId: gateway.keyId,
    };
  }

  private activeMembership(userId: string) {
    return this.prisma.sellerMembership.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });
  }

  /**
   * Mark the payment PAID and apply its effect — exactly once. The status guard
   * makes it idempotent across verify + webhook. REGISTRATION sets the paid
   * flag; MEMBERSHIP opens (or stacks onto) an access window.
   */
  private async settle(gatewayOrderId: string, paymentId: string) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.sellerPayment.findUnique({
        where: { gatewayOrderId },
      });
      if (!payment) return;

      const transitioned = await tx.sellerPayment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: { status: 'PAID', gatewayPaymentId: paymentId },
      });
      if (transitioned.count === 0) return; // already settled — idempotent

      if (payment.type === 'REGISTRATION') {
        await tx.user.update({
          where: { id: payment.userId },
          data: { registrationPaidAt: new Date() },
        });
        return;
      }

      if (payment.type === 'MEMBERSHIP' && payment.plan) {
        const info = MEMBERSHIP_PLANS[payment.plan];
        // Stack onto the current window if the seller is still active.
        const current = await tx.sellerMembership.findFirst({
          where: { userId: payment.userId, expiresAt: { gt: new Date() } },
          orderBy: { expiresAt: 'desc' },
        });
        const startsAt = current ? current.expiresAt : new Date();
        const expiresAt = new Date(
          startsAt.getTime() + info.durationDays * DAY_MS,
        );
        await tx.sellerMembership.create({
          data: {
            userId: payment.userId,
            plan: payment.plan,
            startsAt,
            expiresAt,
          },
        });
      }
    });
  }
}
