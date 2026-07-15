import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  GenerateLabelResponse,
  SellerSale,
  ShippingAddress,
} from '@nutrimom/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  SHIPPING_PROVIDER,
  type ShippingProvider,
} from './shipping-provider.interface';

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SHIPPING_PROVIDER) private readonly provider: ShippingProvider,
  ) {}

  /** Orders (paid onward) that contain this seller's items, with fulfil state. */
  async listSales(sellerId: string): Promise<SellerSale[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        items: { some: { sellerId } },
      },
      include: { items: true, shipments: { where: { sellerId } } },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => {
      const addr = order.shippingAddress as unknown as ShippingAddress;
      const shipment = order.shipments[0];
      return {
        orderId: order.id,
        createdAt: order.createdAt.toISOString(),
        shipmentStatus: shipment?.status ?? 'PENDING',
        courier: shipment?.courier ?? null,
        trackingId: shipment?.trackingId ?? null,
        shipToCity: addr.city,
        shipToState: addr.state,
        items: order.items
          .filter((i) => i.sellerId === sellerId)
          .map((i) => ({
            title: i.listingTitle,
            unitPriceInPaise: i.unitPriceInPaise,
            image: i.image,
          })),
      };
    });
  }

  /** Generate (or re-generate) this seller's shipping label for an order. */
  async generateLabel(
    sellerId: string,
    orderId: string,
  ): Promise<GenerateLabelResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, buyer: { select: { name: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const sellerItems = order.items.filter((i) => i.sellerId === sellerId);
    if (sellerItems.length === 0) {
      throw new ForbiddenException('You have no items in this order');
    }
    if (order.status === 'PENDING' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        'A label can only be generated after payment is confirmed',
      );
    }

    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { name: true, city: true, whatsappNumber: true },
    });

    const label = await this.provider.createLabel(
      {
        orderId: order.id,
        createdAt: order.createdAt,
        buyerName: order.buyer.name,
        shippingAddress: order.shippingAddress as unknown as ShippingAddress,
        items: sellerItems.map((i) => ({
          title: i.listingTitle,
          unitPriceInPaise: i.unitPriceInPaise,
        })),
      },
      {
        name: seller?.name ?? 'Seller',
        city: seller?.city ?? null,
        whatsappNumber: seller?.whatsappNumber ?? null,
      },
    );

    // Don't downgrade an already-shipped shipment back to LABEL_GENERATED.
    const existing = await this.prisma.shipment.findUnique({
      where: { orderId_sellerId: { orderId, sellerId } },
      select: { status: true },
    });
    const status =
      existing?.status === 'SHIPPED' || existing?.status === 'DELIVERED'
        ? existing.status
        : 'LABEL_GENERATED';

    const shipment = await this.prisma.shipment.upsert({
      where: { orderId_sellerId: { orderId, sellerId } },
      create: {
        orderId,
        sellerId,
        status: 'LABEL_GENERATED',
        courier: label.courier,
        trackingId: label.trackingId,
        labelUrl: label.labelUrl,
        labelGeneratedAt: new Date(),
      },
      update: {
        status,
        courier: label.courier,
        trackingId: label.trackingId,
        labelUrl: label.labelUrl,
        labelGeneratedAt: new Date(),
      },
    });

    return {
      shipmentId: shipment.id,
      status: shipment.status,
      courier: label.courier,
      trackingId: label.trackingId,
      labelUrl: label.labelUrl,
      labelHtml: label.labelHtml,
    };
  }

  /** Mark this seller's shipment handed to the courier. */
  async markShipped(sellerId: string, orderId: string): Promise<SellerSale> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId_sellerId: { orderId, sellerId } },
    });
    if (!shipment || shipment.status === 'PENDING') {
      throw new BadRequestException('Generate the shipping label first');
    }
    if (shipment.status === 'LABEL_GENERATED') {
      await this.prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: 'SHIPPED', shippedAt: new Date() },
      });
      await this.maybeMarkOrderShipped(orderId);
    }
    const sales = await this.listSales(sellerId);
    const row = sales.find((s) => s.orderId === orderId);
    if (!row) throw new NotFoundException('Sale not found');
    return row;
  }

  // When every seller in an order has shipped, advance the order to SHIPPED.
  private async maybeMarkOrderShipped(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipments: true },
    });
    if (!order || order.status !== 'PAID') return;
    const sellerIds = new Set(order.items.map((i) => i.sellerId));
    const shippedSellers = new Set(
      order.shipments
        .filter((s) => s.status === 'SHIPPED' || s.status === 'DELIVERED')
        .map((s) => s.sellerId),
    );
    const allShipped = [...sellerIds].every((id) => shippedSellers.has(id));
    if (allShipped) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'SHIPPED' },
      });
    }
  }
}
