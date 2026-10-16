import {
  buyerWelcomeTemplate,
  orderDeliveredTemplate,
  orderSuccessfulTemplate,
  sellerOrderRequestTemplate,
  sellerWelcomeTemplate,
  subscriptionConfirmedTemplate,
  type EmailTemplate,
} from './mail.templates';

const assertComplete = (template: EmailTemplate) => {
  expect(template.subject).toBeTruthy();
  expect(template.html).toContain('<!doctype html>');
  expect(template.html).toContain('The Nurture Moms');
  expect(template.text).toBeTruthy();
};

describe('transactional email templates', () => {
  it('renders all six lifecycle templates with HTML and plain-text fallbacks', () => {
    const item = { title: 'Organic wrap', priceInPaise: 125050 };
    const templates = [
      buyerWelcomeTemplate({
        name: 'Asha Menon',
        browseUrl: 'https://example.com/listings',
      }),
      sellerWelcomeTemplate({
        name: 'Asha Menon',
        membershipUrl: 'https://example.com/account/membership',
      }),
      subscriptionConfirmedTemplate({
        name: 'Asha Menon',
        planLabel: 'Yearly',
        amountInPaise: 99900,
        startsAt: new Date('2026-10-16T00:00:00Z'),
        expiresAt: new Date('2027-10-16T00:00:00Z'),
        sellUrl: 'https://example.com/sell',
      }),
      orderSuccessfulTemplate({
        name: 'Asha Menon',
        orderNumber: 'NM-20261016-001',
        items: [item],
        totalInPaise: item.priceInPaise,
        orderUrl: 'https://example.com/orders/o1',
      }),
      orderDeliveredTemplate({
        name: 'Asha Menon',
        orderNumber: 'NM-20261016-001',
        items: [item],
        orderUrl: 'https://example.com/orders/o1',
      }),
      sellerOrderRequestTemplate({
        name: 'Meera Rao',
        orderNumber: 'NM-20261016-001',
        items: [item],
        subtotalInPaise: item.priceInPaise,
        salesUrl: 'https://example.com/account/sales',
      }),
    ];

    templates.forEach(assertComplete);
  });

  it('escapes user and listing content before placing it in HTML', () => {
    const template = orderSuccessfulTemplate({
      name: '<script>alert(1)</script>',
      orderNumber: 'NM-1',
      items: [{ title: '<img src=x onerror=alert(1)>', priceInPaise: 10000 }],
      totalInPaise: 10000,
      orderUrl: 'https://example.com/orders/o1?x=1&y=2',
    });

    expect(template.html).not.toContain('<script>');
    expect(template.html).not.toContain('<img src=x');
    expect(template.html).toContain('&lt;script&gt;');
    expect(template.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(template.html).toContain('x=1&amp;y=2');
  });

  it('shows authoritative membership dates and amount', () => {
    const template = subscriptionConfirmedTemplate({
      name: 'Asha',
      planLabel: 'Monthly',
      amountInPaise: 9900,
      startsAt: new Date('2026-10-16T00:00:00Z'),
      expiresAt: new Date('2026-11-15T00:00:00Z'),
      sellUrl: 'https://example.com/sell',
    });

    expect(template.text).toContain('Monthly');
    expect(template.text).toContain('₹99');
    expect(template.text).toContain('16 October 2026');
    expect(template.text).toContain('15 November 2026');
  });
});
