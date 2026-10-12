import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import type {
  GeneratedLabel,
  LabelOrder,
  LabelSeller,
  ShippingProvider,
} from '../shipping-provider.interface';

const API = 'https://apiv2.shiprocket.in/v1/external';
// Shiprocket tokens are valid for 10 days; refresh well before that rather
// than discovering expiry on a seller's label request.
const TOKEN_TTL_MS = 8 * 24 * 60 * 60 * 1000;
// Bounded deadline on every call. Without one a stalled connection holds the
// seller's label request open indefinitely — three chained calls per label
// means three chances to hang.
const REQUEST_TIMEOUT_MS = 15_000;

interface LoginResponse {
  token: string;
}
interface CreateOrderResponse {
  order_id: number;
  shipment_id: number;
  awb_code?: string | null;
  courier_name?: string | null;
}
interface AssignAwbResponse {
  response?: {
    data?: {
      awb_code?: string | null;
      courier_name?: string | null;
    };
  };
}
interface GenerateLabelResponse {
  label_created?: number;
  label_url?: string | null;
}

/**
 * Real courier AWBs via Shiprocket. Selected by `SHIPPING_PROVIDER=shiprocket`
 * with `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` / `SHIPROCKET_PICKUP_LOCATION`.
 *
 * Three calls per label: create the order, assign an AWB (which picks the
 * courier), then generate the printable label. The AWB is what the buyer can
 * actually track, so it's returned as `trackingId` and stored on the Shipment.
 *
 * **Not verified against the live Shiprocket API** — that needs the operator's
 * account credentials. The request/response shapes follow their v1 external
 * API docs; expect to confirm field names on first real use. `manual` remains
 * the default provider, so nothing changes until this is switched on.
 */
@Injectable()
export class ShiprocketProvider implements ShippingProvider {
  readonly name = 'shiprocket';
  private readonly logger = new Logger(ShiprocketProvider.name);
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async createLabel(
    order: LabelOrder,
    seller: LabelSeller,
  ): Promise<GeneratedLabel> {
    const created = await this.call<CreateOrderResponse>(
      '/orders/create/adhoc',
      this.orderPayload(order, seller),
    );

    // A newly created order usually has no AWB until one is assigned.
    let awb = created.awb_code ?? null;
    let courier = created.courier_name ?? null;
    if (!awb) {
      const assigned = await this.call<AssignAwbResponse>(
        '/courier/assign/awb',
        { shipment_id: created.shipment_id },
      );
      awb = assigned.response?.data?.awb_code ?? null;
      courier = assigned.response?.data?.courier_name ?? null;
    }

    const label = await this.call<GenerateLabelResponse>(
      '/courier/generate/label',
      { shipment_id: [created.shipment_id] },
    );

    if (!label.label_url) {
      // Without a label there is nothing for the seller to print, and a
      // silently label-less shipment is worse than a clear failure.
      throw new InternalServerErrorException(
        'Shiprocket did not return a label for this shipment',
      );
    }

    return {
      courier: courier ?? 'Shiprocket',
      trackingId: awb,
      labelUrl: label.label_url,
      labelHtml: null,
    };
  }

  private orderPayload(order: LabelOrder, seller: LabelSeller) {
    const a = order.shippingAddress;
    // Shiprocket wants rupees, not paise, and a non-zero declared value.
    const subTotal = order.items.reduce(
      (sum, i) => sum + i.unitPriceInPaise,
      0,
    );
    return {
      // Per (order, seller), not the bare order number — Shiprocket rejects a
      // duplicate active reference, so two sellers on one order would clash.
      order_id: order.reference,
      order_date: order.createdAt.toISOString().slice(0, 10),
      pickup_location: this.config.get('SHIPROCKET_PICKUP_LOCATION', {
        infer: true,
      }),
      billing_customer_name: order.shippingAddress.fullName,
      billing_last_name: '',
      billing_address: a.line1,
      billing_address_2: a.line2 ?? '',
      billing_city: a.city,
      billing_pincode: a.postalCode,
      billing_state: a.state,
      billing_country: a.country,
      billing_email: '',
      billing_phone: a.phone,
      shipping_is_billing: true,
      order_items: order.items.map((i) => ({
        name: i.title,
        sku: `${order.reference}-${i.title.slice(0, 12)}`,
        units: 1,
        selling_price: i.unitPriceInPaise / 100,
      })),
      payment_method: 'Prepaid', // online-only marketplace; COD is retired
      sub_total: subTotal / 100,
      // Secondhand baby/kids items — a sane default parcel, since sellers
      // don't enter dimensions. Shiprocket bills on volumetric weight, so
      // these should be tuned once real parcels are going out.
      length: 30,
      breadth: 25,
      height: 12,
      weight: 1,
      comment: `Seller: ${seller.name}${seller.city ? ` (${seller.city})` : ''}`,
    };
  }

  /** POST to Shiprocket with a cached bearer token, re-authing on 401. */
  private async call<T>(path: string, body: unknown): Promise<T> {
    let token = await this.authToken();
    let res = await this.post(path, body, token);

    if (res.status === 401) {
      // Token rejected early (revoked, or their side expired it) — re-auth
      // once rather than failing a seller's label request.
      this.token = null;
      token = await this.authToken();
      res = await this.post(path, body, token);
    }

    const text = await res.text();
    if (!res.ok) {
      this.logger.error(
        `Shiprocket ${path} failed: ${res.status} ${text.slice(0, 400)}`,
      );
      throw new InternalServerErrorException(
        'Could not create a courier shipment just now. Please try again.',
      );
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  private post(path: string, body: unknown, token: string) {
    return fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  private async authToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) {
      return this.token.value;
    }
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.config.get('SHIPROCKET_EMAIL', { infer: true }),
        password: this.config.get('SHIPROCKET_PASSWORD', { infer: true }),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      this.logger.error(`Shiprocket auth failed: ${res.status}`);
      throw new InternalServerErrorException(
        'Courier account is not reachable. Please try again shortly.',
      );
    }
    const data = (await res.json()) as LoginResponse;
    this.token = {
      value: data.token,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    };
    return data.token;
  }
}
