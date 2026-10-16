export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface MailItem {
  title: string;
  priceInPaise: number;
}

interface BaseTemplateInput {
  preheader: string;
  eyebrow: string;
  heading: string;
  intro: string;
  content: string;
  ctaLabel: string;
  ctaUrl: string;
}

const BRAND_NAME = 'Preloved by The Nurture Moms';

export function buyerWelcomeTemplate(input: {
  name: string;
  browseUrl: string;
}): EmailTemplate {
  return {
    subject: `Welcome to ${BRAND_NAME}`,
    html: layout({
      preheader: 'Your preloved marketplace account is ready.',
      eyebrow: 'Welcome',
      heading: `Hello ${escapeHtml(firstName(input.name))}`,
      intro:
        'Your account is ready. Discover thoughtfully preloved baby, kids and maternity essentials from families across India.',
      content: callout(
        'Buy with confidence',
        'Read every description, review all photos and pay securely online. You can follow each purchase from your account.',
      ),
      ctaLabel: 'Browse preloved finds',
      ctaUrl: input.browseUrl,
    }),
    text: `Hello ${firstName(input.name)},\n\nWelcome to ${BRAND_NAME}. Your account is ready. Discover thoughtfully preloved baby, kids and maternity essentials from families across India.\n\nBrowse preloved finds: ${input.browseUrl}`,
  };
}

export function sellerWelcomeTemplate(input: {
  name: string;
  membershipUrl: string;
}): EmailTemplate {
  return {
    subject: 'Welcome to selling with The Nurture Moms',
    html: layout({
      preheader: 'We received your seller registration.',
      eyebrow: 'Seller registration received',
      heading: `Welcome, ${escapeHtml(firstName(input.name))}`,
      intro:
        'Your seller registration payment is confirmed. An admin will review your profile before your listings can go live.',
      content:
        callout(
          'What happens next',
          'Complete your seller profile, wait for approval, then choose an active membership plan to start listing.',
        ) +
        checklist([
          'Use genuine photos of the exact item.',
          'Describe wear, defects and condition clearly.',
          'Ship promptly using the marketplace-generated label.',
        ]),
      ctaLabel: 'View seller membership',
      ctaUrl: input.membershipUrl,
    }),
    text: `Welcome, ${firstName(input.name)}.\n\nYour seller registration payment is confirmed. An admin will review your profile before your listings can go live. Complete your profile and choose an active membership plan to start listing.\n\nView seller membership: ${input.membershipUrl}`,
  };
}

export function subscriptionConfirmedTemplate(input: {
  name: string;
  planLabel: string;
  amountInPaise: number;
  startsAt: Date;
  expiresAt: Date;
  sellUrl: string;
}): EmailTemplate {
  const details = detailTable([
    ['Plan', input.planLabel],
    ['Amount paid', formatMoney(input.amountInPaise)],
    ['Starts', formatDate(input.startsAt)],
    ['Valid until', formatDate(input.expiresAt)],
  ]);
  return {
    subject: `${input.planLabel} seller membership confirmed`,
    html: layout({
      preheader: `Your ${input.planLabel.toLowerCase()} seller membership is active.`,
      eyebrow: 'Membership confirmed',
      heading: `You’re all set, ${escapeHtml(firstName(input.name))}`,
      intro:
        'Your payment was successful and your seller membership window has been added to your account.',
      content: details,
      ctaLabel: 'Create a listing',
      ctaUrl: input.sellUrl,
    }),
    text: `Hello ${firstName(input.name)},\n\nYour ${input.planLabel} seller membership is confirmed.\nPlan: ${input.planLabel}\nAmount paid: ${formatMoney(input.amountInPaise)}\nStarts: ${formatDate(input.startsAt)}\nValid until: ${formatDate(input.expiresAt)}\n\nCreate a listing: ${input.sellUrl}`,
  };
}

export function orderSuccessfulTemplate(input: {
  name: string;
  orderNumber: string;
  items: MailItem[];
  totalInPaise: number;
  orderUrl: string;
}): EmailTemplate {
  return {
    subject: `Order ${input.orderNumber} confirmed`,
    html: layout({
      preheader: 'Your payment was successful and your order is confirmed.',
      eyebrow: 'Payment successful',
      heading: 'Your order is confirmed',
      intro: `Thanks, ${escapeHtml(firstName(input.name))}. We’ve received your payment and notified ${input.items.length === 1 ? 'the seller' : 'the sellers'} to prepare your order.`,
      content:
        detailTable([['Order', input.orderNumber]]) +
        itemTable(input.items, 'Order total', input.totalInPaise),
      ctaLabel: 'View your order',
      ctaUrl: input.orderUrl,
    }),
    text: `Hello ${firstName(input.name)},\n\nPayment successful. Order ${input.orderNumber} is confirmed.\n${plainItems(input.items)}\nOrder total: ${formatMoney(input.totalInPaise)}\n\nView your order: ${input.orderUrl}`,
  };
}

export function orderDeliveredTemplate(input: {
  name: string;
  orderNumber: string;
  items: MailItem[];
  orderUrl: string;
}): EmailTemplate {
  return {
    subject: `Order ${input.orderNumber} delivered`,
    html: layout({
      preheader: 'Your order has been marked delivered.',
      eyebrow: 'Delivered',
      heading: 'Your preloved finds have arrived',
      intro: `Hello ${escapeHtml(firstName(input.name))}. Order ${escapeHtml(input.orderNumber)} has been marked as delivered. We hope everything is just as expected.`,
      content:
        itemTable(input.items) +
        callout(
          'Something not right?',
          'Review the item promptly and contact support from your order page if its condition differs from the listing.',
        ),
      ctaLabel: 'Review your order',
      ctaUrl: input.orderUrl,
    }),
    text: `Hello ${firstName(input.name)},\n\nOrder ${input.orderNumber} has been marked delivered. We hope everything is just as expected.\n${plainItems(input.items)}\n\nReview your order: ${input.orderUrl}`,
  };
}

export function sellerOrderRequestTemplate(input: {
  name: string;
  orderNumber: string;
  items: MailItem[];
  subtotalInPaise: number;
  salesUrl: string;
}): EmailTemplate {
  return {
    subject: `New order to fulfil — ${input.orderNumber}`,
    html: layout({
      preheader: 'A buyer has paid for your item. Prepare it for shipping.',
      eyebrow: 'New paid order',
      heading: `You made a sale, ${escapeHtml(firstName(input.name))}`,
      intro:
        'The buyer’s payment is confirmed. Please prepare the item carefully, generate the marketplace shipping label and hand the parcel to the courier on time.',
      content:
        detailTable([['Order', input.orderNumber]]) +
        itemTable(input.items, 'Item subtotal', input.subtotalInPaise) +
        callout(
          'Before you ship',
          'Check the item against its description, package it safely and use only the label generated from your Sales page.',
        ),
      ctaLabel: 'Open seller sales',
      ctaUrl: input.salesUrl,
    }),
    text: `Hello ${firstName(input.name)},\n\nYou have a new paid order: ${input.orderNumber}.\n${plainItems(input.items)}\nItem subtotal: ${formatMoney(input.subtotalInPaise)}\n\nPrepare the item, generate its marketplace label and mark it shipped from: ${input.salesUrl}`,
  };
}

function layout(input: BaseTemplateInput): string {
  const ctaUrl = escapeHtml(input.ctaUrl);
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f7f2ea;color:#24362c;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f2ea;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffdf9;border:1px solid #eadfce;border-radius:20px;overflow:hidden;">
          <tr><td style="background:#416d52;padding:22px 32px;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:21px;">The Nurture Moms</td></tr>
          <tr><td style="padding:38px 32px 18px;">
            <div style="color:#b7634d;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</div>
            <h1 style="margin:10px 0 14px;color:#1f3027;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;">${input.heading}</h1>
            <p style="margin:0;color:#536158;font-size:16px;line-height:1.65;">${input.intro}</p>
          </td></tr>
          <tr><td style="padding:4px 32px 8px;">${input.content}</td></tr>
          <tr><td style="padding:22px 32px 40px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#416d52;border-radius:999px;color:#ffffff;font-size:15px;font-weight:700;padding:14px 24px;text-decoration:none;">${escapeHtml(input.ctaLabel)}</a>
          </td></tr>
          <tr><td style="border-top:1px solid #eadfce;padding:22px 32px;color:#7a817c;font-size:12px;line-height:1.6;">
            ${BRAND_NAME}<br>This is a transactional email about your account or order.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function callout(title: string, body: string): string {
  return `<div style="margin:18px 0;padding:18px 20px;background:#f2f6f1;border-radius:14px;">
    <div style="color:#2f5940;font-size:14px;font-weight:700;margin-bottom:6px;">${escapeHtml(title)}</div>
    <div style="color:#536158;font-size:14px;line-height:1.6;">${escapeHtml(body)}</div>
  </div>`;
}

function checklist(items: string[]): string {
  return `<ul style="margin:18px 0;padding-left:22px;color:#536158;font-size:14px;line-height:1.8;">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function detailTable(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border-collapse:collapse;">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="border-bottom:1px solid #eee5d9;padding:10px 0;color:#7a817c;font-size:13px;">${escapeHtml(label)}</td><td align="right" style="border-bottom:1px solid #eee5d9;padding:10px 0;color:#24362c;font-size:14px;font-weight:700;">${escapeHtml(value)}</td></tr>`,
    )
    .join('')}</table>`;
}

function itemTable(
  items: MailItem[],
  totalLabel?: string,
  totalInPaise?: number,
): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="border-bottom:1px solid #eee5d9;padding:12px 0;color:#24362c;font-size:14px;">${escapeHtml(item.title)}</td><td align="right" style="border-bottom:1px solid #eee5d9;padding:12px 0;color:#24362c;font-size:14px;white-space:nowrap;">${escapeHtml(formatMoney(item.priceInPaise))}</td></tr>`,
    )
    .join('');
  const total =
    totalLabel && totalInPaise !== undefined
      ? `<tr><td style="padding:14px 0 0;color:#24362c;font-size:15px;font-weight:700;">${escapeHtml(totalLabel)}</td><td align="right" style="padding:14px 0 0;color:#24362c;font-size:16px;font-weight:700;white-space:nowrap;">${escapeHtml(formatMoney(totalInPaise))}</td></tr>`
      : '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border-collapse:collapse;">${rows}${total}</table>`;
}

function plainItems(items: MailItem[]): string {
  return items
    .map((item) => `- ${item.title}: ${formatMoney(item.priceInPaise)}`)
    .join('\n');
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

function formatMoney(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character]!,
  );
}
