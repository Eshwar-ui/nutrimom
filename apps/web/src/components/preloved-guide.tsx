import Link from "next/link";
import {
  Camera,
  Gift,
  Handshake,
  ShoppingBag,
  Tag,
  UserCheck,
} from "lucide-react";
import {
  MEMBERSHIP_PLANS,
  MEMBERSHIP_PLAN_ORDER,
  REGISTRATION_FEE_PAISE,
  formatBps,
  formatPaise,
  type CancellationPolicy,
} from "@nutrimom/shared";
import { HowItWorksTabs, type HowItWorksTab } from "./how-it-works-tabs";
import { TrackedLink } from "./tracked-link";
import { buttonVariants } from "./ui/button";
import { hoursText, refundShareText } from "@/lib/marketplace-policy";
import { cn } from "@/lib/utils";

/**
 * /preloved's "How it works": buying, selling and donating, with the fees,
 * delivery, refunds, cancellations and disputes for each (brief §4/§6,
 * REDESIGN-PLAN Phase 8).
 *
 * No figure on this page is typed in. The registration fee and plans are the
 * shared constants the billing gate charges; the cancellation window, refund
 * share and dispute window are the live CancellationPolicy that
 * OrdersService.cancel enforces; the commission is the live payout policy.
 * When one can't be read, the sentence is worded without the figure rather
 * than guessing it.
 */
export function PrelovedHowItWorks({
  policy,
  commissionBps,
}: {
  policy: CancellationPolicy | null;
  commissionBps: number | null;
}) {
  const cancelWindow = policy
    ? `within ${hoursText(policy.cutoffHours)} of ordering`
    : "within the time shown when you order";
  const disputeWindow = policy
    ? `within ${hoursText(policy.conditionDisputeHours)} of delivery`
    : "as soon as possible after delivery";
  const refund = refundShareText(policy);
  const commission =
    commissionBps !== null
      ? `a ${formatBps(commissionBps)} commission`
      : "our commission";

  const tabs: HowItWorksTab[] = [
    {
      id: "buying",
      label: "Buying",
      icon: <ShoppingBag className="h-4 w-4" />,
      content: (
        <>
          <Steps
            steps={[
              {
                title: "Find something you love",
                body: "Browse by category or search. Look at every photo, read the description and condition, and check the seller's profile. Have a question? Message the seller before you order.",
              },
              {
                title: "Pay securely online",
                body: "Pay by UPI, card or net banking. There is no cash on delivery. Your order is confirmed as soon as the payment goes through, and the item is kept aside for you.",
              },
              {
                title: "Receive it",
                body: "The seller packs the item and sends it with a printable address label we provide. If the listing offers pickup, you can collect it locally instead.",
              },
              {
                title: "Confirm it arrived",
                body: "Once it's with you, confirm delivery from your order page. That's when the seller gets paid.",
              },
            ]}
          />
          <Facts
            items={[
              {
                title: "Fees",
                body: "Buying is free. You pay the price shown on the listing — we don't add a buying fee.",
              },
              {
                title: "Delivery",
                body: "Sent by the seller with our printable address label, or picked up locally when the listing offers pickup. Each listing shows which.",
              },
              {
                title: "Cancellations & refunds",
                body: (
                  <>
                    You can cancel from <TextLink href="/account/orders">My orders</TextLink>{" "}
                    {cancelWindow}, as long as the seller hasn&apos;t printed the
                    address label yet. You&apos;ll get {refund} to your original
                    payment method — banks usually take 5–7 working days.
                  </>
                ),
              },
              {
                title: "Returns & disputes",
                body: (
                  <>
                    Because items are preloved, we can&apos;t take
                    change-of-mind returns. If an item arrives clearly different
                    from its listing, <TextLink href="/contact">contact us</TextLink>{" "}
                    {disputeWindow}{" "}
                    with your order number and photos. We&apos;ll
                    check it against the listing and, if we agree, refund you.
                  </>
                ),
              },
            ]}
          />
          <BuyingTips />
          <PanelActions>
            <TrackedLink
              event="preloved_click"
              eventProps={{ action: "shop", placement: "how_it_works" }}
              href="/listings"
              className={buttonVariants()}
            >
              Shop Preloved
            </TrackedLink>
          </PanelActions>
        </>
      ),
    },
    {
      id: "selling",
      label: "Selling",
      icon: <Tag className="h-4 w-4" />,
      content: (
        <>
          <Steps
            steps={[
              {
                title: "Register as a seller",
                body: `Pay a one-time ${formatPaise(REGISTRATION_FEE_PAISE)} registration fee. Our team then checks and approves your seller account.`,
              },
              {
                title: "Choose a membership plan",
                body: "You need an active plan to list items. Pick the length that suits you — plans are listed below.",
              },
              {
                title: "List your item",
                body: "Add real photos, an honest description of its condition (including any wear or marks) and your price. We review every listing before it goes live.",
              },
              {
                title: "Pack and send it",
                body: "When it sells, print the address label from your Sales page, stick it on the parcel and hand it to the courier or arrange a pickup. Then mark it as shipped.",
              },
              {
                title: "Get paid",
                body: `Once the item is delivered, we transfer the sale price to your bank account, minus ${commission}, with a reference you can check.`,
              },
            ]}
          />
          <Facts
            items={[
              {
                title: "Fees",
                body: (
                  <>
                    <span className="block">
                      {formatPaise(REGISTRATION_FEE_PAISE)} one-time
                      registration, then one of these plans:
                    </span>
                    <ul className="mt-2 grid grid-cols-2 gap-1.5">
                      {MEMBERSHIP_PLAN_ORDER.map((key) => {
                        const plan = MEMBERSHIP_PLANS[key];
                        return (
                          <li key={key} className="rounded-xl bg-surface-2 px-3 py-2">
                            <span className="block text-xs font-semibold text-muted-foreground">
                              {plan.label} · {monthsText(plan.durationDays)}
                            </span>
                            <span className="block font-semibold text-foreground">
                              {formatPaise(plan.priceInPaise)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <span className="mt-2 block">
                      {commissionBps !== null ? (
                        <>
                          We keep {commission} on each sale and pay you the
                          rest.
                        </>
                      ) : (
                        <>
                          We keep a commission on each sale and pay you the
                          rest; your Sales page shows the fee on every order.
                        </>
                      )}
                    </span>
                  </>
                ),
              },
              {
                title: "Delivery",
                body: "You send each sale with the printable address label we give you — please use only this label, as parcels without it may be delayed or cancelled. Or hand it over locally if your listing offers pickup.",
              },
              {
                title: "Cancellations",
                body: `Buyers can cancel ${cancelWindow}, until you've printed the label. A cancelled order puts your item back on sale.`,
              },
              {
                title: "Disputes",
                body: `If a buyer tells us ${disputeWindow} that an item is clearly different from its listing, we review it with photos. If we agree, the buyer is refunded and the amount comes out of your payout.`,
              },
            ]}
          />
          <div className="mt-6 rounded-card border border-border bg-surface-2 p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">
              What we ask of every seller
            </h3>
            <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
              {SELLER_PROMISES.map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Breaking these can lead to a listing being removed or an account
              being suspended.
            </p>
          </div>
          <PanelActions>
            <TrackedLink
              event="preloved_click"
              eventProps={{ action: "sell", placement: "how_it_works" }}
              href="/sell"
              className={buttonVariants()}
            >
              Sell an Item
            </TrackedLink>
          </PanelActions>
        </>
      ),
    },
    {
      id: "donating",
      label: "Donating",
      icon: <Gift className="h-4 w-4" />,
      content: (
        <>
          <Steps
            steps={[
              {
                title: "Tell us about it",
                body: "Fill in the short donation form with what you'd like to pass on and where you are. A photo helps.",
              },
              {
                title: "We get in touch",
                body: "Someone from our team calls or messages you to talk it through.",
              },
              {
                title: "We find a mom who needs it",
                body: "We match your item with a mother in our community who's looking for exactly that.",
              },
              {
                title: "Handover",
                body: "We arrange a pickup or drop-off that suits you.",
              },
            ]}
          />
          <Facts
            items={[
              {
                title: "Fees",
                body: "None. Donating is free, and donated items are given away, never sold.",
              },
              {
                title: "What you can give",
                body: (
                  <>
                    Clean, safe and still useful things.{" "}
                    <TextLink href="/preloved/donate">See what we can accept</TextLink>{" "}
                    before you offer something.
                  </>
                ),
              },
            ]}
          />
          <PanelActions>
            <TrackedLink
              event="preloved_click"
              eventProps={{ action: "donate", placement: "how_it_works" }}
              href="/preloved/donate"
              className={buttonVariants()}
            >
              Donate an Item
            </TrackedLink>
          </PanelActions>
        </>
      ),
    },
  ];

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="mt-section scroll-mt-28">
      <div className="max-w-2xl">
        <h2
          id="how-it-works-heading"
          className="font-display text-2xl font-semibold text-foreground sm:text-3xl"
        >
          How it works
        </h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Buying, selling and donating, step by step — including what it costs,
          how items reach you, and what happens if something goes wrong.
        </p>
      </div>
      <div className="mt-6">
        <HowItWorksTabs tabs={tabs} />
      </div>
      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        The full rules are in our{" "}
        <TextLink href="/policies">Marketplace policies</TextLink> and{" "}
        <TextLink href="/refunds">Refund &amp; cancellation policy</TextLink>.
      </p>
    </section>
  );
}

/** §5 of the brief, in plain words. */
const SELLER_PROMISES = [
  "Describe items accurately and use genuine photos of the actual item",
  "Mention any defects, wear or missing parts",
  "Send items within the time you agreed",
  "Pack items safely",
  "Use only the address label we give you",
  "Be kind and respectful with buyers",
];

/** 30 → "1 month", 365 → "12 months". */
function monthsText(days: number): string {
  const months = Math.max(1, Math.round(days / 30));
  return `${months} ${months === 1 ? "month" : "months"}`;
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-accent-text underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        steps.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
      )}
    >
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4 rounded-card border border-border bg-surface p-5 sm:block">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage/50 font-display text-base font-semibold text-sage-ink"
          >
            {i + 1}
          </span>
          <div className="sm:mt-3">
            <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Facts({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <dl className="mt-6 grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-card border border-border bg-surface p-5">
          <dt className="font-display text-base font-semibold text-foreground">{item.title}</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

function PanelActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-wrap gap-3">{children}</div>;
}

/**
 * Three habits for buying secondhand well. These used to sit on the home page
 * under a "Testimonials" name; they are tips, so they live with the buying
 * explainer now.
 */
const BUYING_TIPS = [
  {
    icon: Camera,
    title: "Look closely",
    body: "Check every photo, the condition, what's included and why it's being sold before you order.",
    tint: "bg-blush/60 text-blush-ink",
  },
  {
    icon: UserCheck,
    title: "Know the seller",
    body: "Look at the seller's profile and other listings. Ask about anything the listing doesn't answer.",
    tint: "bg-sky text-sky-ink",
  },
  {
    icon: Handshake,
    title: "Plan the handover",
    body: "Agree on pickup or delivery, timing and packing, and ask about the history of anything safety-related, like a car seat.",
    tint: "bg-sage/60 text-sage-ink",
  },
];

function BuyingTips() {
  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-semibold text-foreground">Before you buy</h3>
      <ul className="mt-3 grid gap-4 md:grid-cols-3">
        {BUYING_TIPS.map((tip) => (
          <li key={tip.title} className="flex gap-4 rounded-card border border-border bg-surface p-5">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", tip.tint)}>
              <tip.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-foreground">{tip.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{tip.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
