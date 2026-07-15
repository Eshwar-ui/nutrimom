import type { ShippingAddress } from '@nutrimom/shared';

// Vendor-agnostic shipping contract — mirrors PaymentProvider. The built-in
// ManualLabelProvider renders a printable address label with no external vendor;
// a ShiprocketProvider (added later) would return a real AWB label URL +
// tracking id. ShippingService depends only on this interface.

export interface LabelSeller {
  name: string;
  city: string | null;
  whatsappNumber: string | null;
}

export interface LabelOrder {
  orderId: string;
  createdAt: Date;
  buyerName: string;
  shippingAddress: ShippingAddress;
  items: { title: string; unitPriceInPaise: number }[];
}

export interface GeneratedLabel {
  courier: string; // e.g. 'Self-ship', 'Shiprocket'
  trackingId: string | null; // AWB / reference, if the provider issues one
  labelUrl: string | null; // provider-hosted PDF, if any
  labelHtml: string | null; // inline printable HTML (manual provider)
}

export interface ShippingProvider {
  readonly name: string;
  createLabel(order: LabelOrder, seller: LabelSeller): Promise<GeneratedLabel>;
}

export const SHIPPING_PROVIDER = 'SHIPPING_PROVIDER';
