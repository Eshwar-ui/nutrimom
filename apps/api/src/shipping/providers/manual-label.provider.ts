import { Injectable } from '@nestjs/common';
import type {
  GeneratedLabel,
  LabelOrder,
  LabelSeller,
  ShippingProvider,
} from '../shipping-provider.interface';

/**
 * Zero-vendor label: renders a printable, marketplace-branded address label the
 * seller opens and prints (browser → PDF), then affixes to the package. No
 * scannable courier AWB — that arrives when a courier provider (Shiprocket/…)
 * is configured. Reference id is marketplace-generated for tracking on our side.
 */
@Injectable()
export class ManualLabelProvider implements ShippingProvider {
  readonly name = 'manual';

  createLabel(order: LabelOrder, seller: LabelSeller): Promise<GeneratedLabel> {
    const ref = `NM-${order.orderId.slice(-6).toUpperCase()}`;
    const a = order.shippingAddress;
    const line2 = a.line2 ? `${esc(a.line2)}<br/>` : '';
    const items = order.items.map((i) => `<li>${esc(i.title)}</li>`).join('');

    const labelHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Shipping label ${ref}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 14px/1.4 -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 24px; color: #1a1a1a; }
  .label { max-width: 620px; margin: 0 auto; border: 2px solid #1a1a1a; border-radius: 8px; overflow: hidden; }
  .bar { display: flex; justify-content: space-between; align-items: center; background: #1a1a1a; color: #fff; padding: 10px 16px; }
  .brand { font-weight: 700; letter-spacing: .02em; }
  .ref { font-family: ui-monospace, Menlo, monospace; font-size: 18px; font-weight: 700; }
  .row { display: flex; gap: 16px; padding: 16px; border-bottom: 1px dashed #bbb; }
  .box { flex: 1; }
  .k { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #666; margin-bottom: 4px; }
  .v { font-size: 15px; }
  .to .v { font-size: 17px; font-weight: 600; }
  ul { margin: 6px 0 0; padding-left: 18px; }
  .foot { padding: 12px 16px; font-size: 11px; color: #666; }
  @media print { body { padding: 0; } .noprint { display: none; } }
  .noprint { text-align: center; margin: 16px 0; }
  button { font: inherit; padding: 8px 18px; border-radius: 999px; border: 0; background: #1a1a1a; color: #fff; cursor: pointer; }
</style></head>
<body>
  <div class="noprint"><button onclick="window.print()">Print this label</button></div>
  <div class="label">
    <div class="bar"><span class="brand">Preloved by The Nurture Moms</span><span class="ref">${ref}</span></div>
    <div class="row">
      <div class="box to"><div class="k">Ship to</div>
        <div class="v">${esc(a.fullName)}<br/>${esc(a.line1)}<br/>${line2}${esc(a.city)}, ${esc(a.state)} ${esc(a.postalCode)}<br/>${esc(a.country)}<br/>${esc(a.phone)}</div>
      </div>
      <div class="box"><div class="k">From (seller)</div>
        <div class="v">${esc(seller.name)}${seller.city ? `<br/>${esc(seller.city)}` : ''}${seller.whatsappNumber ? `<br/>${esc(seller.whatsappNumber)}` : ''}</div>
      </div>
    </div>
    <div class="row"><div class="box"><div class="k">Items</div><ul>${items}</ul></div></div>
    <div class="foot">Affix this label to the package and hand it to your courier. Reference ${ref} · placed ${order.createdAt.toISOString().slice(0, 10)}.</div>
  </div>
</body></html>`;

    return Promise.resolve({
      courier: 'Self-ship',
      trackingId: ref,
      labelUrl: null,
      labelHtml,
    });
  }
}

// Minimal HTML escaping for interpolated address/title text.
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
