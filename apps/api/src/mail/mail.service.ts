import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MEMBERSHIP_PLANS } from '@nutrimom/shared';
import type { Env } from '../config/env.validation';
import { PrismaService } from '../prisma/prisma.service';
import {
  buyerWelcomeTemplate,
  orderDeliveredTemplate,
  orderSuccessfulTemplate,
  sellerOrderRequestTemplate,
  sellerWelcomeTemplate,
  subscriptionConfirmedTemplate,
  type EmailTemplate,
} from './mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly webUrl: string;

  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = config.get('RESEND_API_KEY', { infer: true });
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = config.get('MAIL_FROM_EMAIL', { infer: true });
    this.webUrl = config.get('WEB_URL', { infer: true }).replace(/\/$/, '');

    if (!this.resend) {
      this.logger.warn(
        'Transactional email is disabled because RESEND_API_KEY is unset',
      );
    }
  }

  /**
   * Best-effort send — logs and swallows failures rather than throwing, so a
   * flaky mail provider can't turn "forgot password" into a 500 that also
   * confirms (via timing/error) whether an email address has an account.
   */
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.send(to, {
      subject: 'Reset your password',
      html: `
          <p>Someone (hopefully you) asked to reset the password on your Preloved by The Nurture Moms account.</p>
          <p><a href="${resetUrl}">Choose a new password</a></p>
          <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        `,
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
    });
  }

  sendBuyerWelcome(to: string, name: string): Promise<void> {
    return this.send(
      to,
      buyerWelcomeTemplate({
        name,
        browseUrl: `${this.webUrl}/listings`,
      }),
    );
  }

  async sendSellerWelcome(userId: string): Promise<void> {
    await this.bestEffort(`seller welcome for user ${userId}`, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user) return;
      await this.send(
        user.email,
        sellerWelcomeTemplate({
          name: user.name,
          membershipUrl: `${this.webUrl}/account/membership`,
        }),
      );
    });
  }

  async sendSubscriptionConfirmed(
    userId: string,
    membershipId: string,
    amountInPaise: number,
  ): Promise<void> {
    await this.bestEffort(`membership ${membershipId}`, async () => {
      const [user, membership] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        }),
        this.prisma.sellerMembership.findUnique({
          where: { id: membershipId },
        }),
      ]);
      if (!user || !membership) return;
      await this.send(
        user.email,
        subscriptionConfirmedTemplate({
          name: user.name,
          planLabel: MEMBERSHIP_PLANS[membership.plan].label,
          amountInPaise,
          startsAt: membership.startsAt,
          expiresAt: membership.expiresAt,
          sellUrl: `${this.webUrl}/sell`,
        }),
      );
    });
  }

  /** Sends the buyer confirmation and one fulfilment request per seller. */
  async sendOrderPaidEmails(orderId: string): Promise<void> {
    await this.bestEffort(`paid order ${orderId}`, async () => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: { select: { name: true, email: true } },
          items: true,
        },
      });
      if (!order) return;

      const items = order.items.map((item) => ({
        title: item.listingTitle,
        priceInPaise: item.unitPriceInPaise,
      }));
      const sellerIds = [...new Set(order.items.map((item) => item.sellerId))];
      const sellers = await this.prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, name: true, email: true },
      });

      await Promise.all([
        this.send(
          order.buyer.email,
          orderSuccessfulTemplate({
            name: order.buyer.name,
            orderNumber: order.orderNumber,
            items,
            totalInPaise: order.totalInPaise,
            orderUrl: `${this.webUrl}/orders/${order.id}`,
          }),
        ),
        ...sellers.map((seller) => {
          const sellerItems = order.items
            .filter((item) => item.sellerId === seller.id)
            .map((item) => ({
              title: item.listingTitle,
              priceInPaise: item.unitPriceInPaise,
            }));
          return this.send(
            seller.email,
            sellerOrderRequestTemplate({
              name: seller.name,
              orderNumber: order.orderNumber,
              items: sellerItems,
              subtotalInPaise: sellerItems.reduce(
                (sum, item) => sum + item.priceInPaise,
                0,
              ),
              salesUrl: `${this.webUrl}/account/sales`,
            }),
          );
        }),
      ]);
    });
  }

  async sendOrderDelivered(orderId: string): Promise<void> {
    await this.bestEffort(`delivered order ${orderId}`, async () => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: { select: { name: true, email: true } },
          items: true,
        },
      });
      if (!order) return;
      await this.send(
        order.buyer.email,
        orderDeliveredTemplate({
          name: order.buyer.name,
          orderNumber: order.orderNumber,
          items: order.items.map((item) => ({
            title: item.listingTitle,
            priceInPaise: item.unitPriceInPaise,
          })),
          orderUrl: `${this.webUrl}/orders/${order.id}`,
        }),
      );
    });
  }

  private async bestEffort(
    label: string,
    operation: () => Promise<void>,
  ): Promise<void> {
    try {
      await operation();
    } catch (err) {
      this.logger.error(
        `Failed to prepare ${label} email`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /** Best effort: mail-provider failures never roll back account/order state. */
  private async send(to: string, template: EmailTemplate): Promise<void> {
    if (!this.resend) return;
    try {
      const { error } = await this.resend.emails.send({
        from: `Preloved by The Nurture Moms <${this.from}>`,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      this.logger.error(
        `Failed to send "${template.subject}" email to ${to}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
