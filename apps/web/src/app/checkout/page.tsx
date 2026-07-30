"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatPaise,
  shippingAddressSchema,
  type Order,
  type RazorpayOrderResponse,
  type ShippingAddress,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { loadRazorpay, openRazorpay } from "@/lib/razorpay";
import { toast } from "@/lib/toast-store";
import {
  classifyPaymentError,
  declinedOutcome,
  type PaymentOutcome,
} from "@/lib/payment-outcome";
import {
  PaymentStatusModal,
  PaymentVerifyingOverlay,
} from "@/components/payment-status-modal";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { Container, Card, Input, Label } from "@/components/ui/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { useAuthHydrated, useCartHydrated } from "@/lib/use-store-hydrated";
import { ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore(cartSubtotal);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Payment attempts have outcomes the inline error line can't express — most
  // importantly "we took your money but couldn't confirm it yet".
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  // The order the current attempt belongs to, so "Check again" knows what to poll.
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const authHydrated = useAuthHydrated();
  const cartHydrated = useCartHydrated();

  useEffect(() => {
    if (authHydrated && !user) router.replace("/login?next=/checkout");
  }, [authHydrated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { country: "India", fullName: user?.name ?? "" },
  });

  if (!authHydrated || !cartHydrated || !user) return <Container className="py-16"><PageSkeleton rows={3} /></Container>;
  if (items.length === 0) {
    return (
      <Container className="py-16 sm:py-24">
        <StatePanel icon={ShoppingBag} title="Nothing to check out" description="Your bag is empty. Add a listing before starting payment." />
      </Container>
    );
  }

  const onSubmit = async (address: ShippingAddress) => {
    setError(null);
    setSubmitting(true);
    try {
      // 1. Create our PENDING order — server re-prices and re-checks stock.
      const order = await authedRequest<Order>("/orders", {
        method: "POST",
        body: {
          listingIds: items.map((i) => i.listingId),
          shippingAddress: address,
        },
      });
      setPendingOrderId(order.id);
      // 2. Create the gateway order to pay against (authoritative amount).
      const pay = await authedRequest<RazorpayOrderResponse>("/payments/order", {
        method: "POST",
        body: { orderId: order.id },
      });
      // 3. Open the gateway checkout; settle on the verified callback.
      await loadRazorpay();
      openRazorpay({
        key: pay.keyId,
        amount: pay.amountInPaise,
        currency: pay.currency,
        name: "Preloved by The Nurture Moms",
        description: `Order ${order.orderNumber}`,
        order_id: pay.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: user?.email,
          contact: address.phone,
        },
        theme: { color: "#e8756a" },
        handler: async (resp) => {
          // From here on the gateway HAS captured the money. Any failure below
          // is a confirmation problem, never a payment failure — say so.
          setVerifying(true);
          try {
            await authedRequest<Order>("/payments/verify", {
              method: "POST",
              body: {
                orderId: order.id,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              },
            });
            clear();
            router.push(`/orders/${order.id}`);
          } catch (err) {
            setOutcome(
              classifyPaymentError(err, {
                charged: true,
                paymentId: resp.razorpay_payment_id,
              }),
            );
            // Deliberately leave `submitting` set: this cart has already been
            // paid for, and re-enabling the button under the dialog would
            // invite a second order for the same items.
          } finally {
            setVerifying(false);
          }
        },
        modal: {
          ondismiss: () => {
            // The order already exists and holds these listings — sending the
            // buyer back to checkout would just fail (items are RESERVED, not
            // APPROVED). The order page has its own "Pay now" retry.
            clear();
            router.push(`/orders/${order.id}`);
          },
        },
      },
        // A declined attempt leaves the order PENDING and the gateway modal
        // open for a retry, so this toasts instead of taking over the screen —
        // and because the Toaster is global, the reason still survives the push
        // to the order page if the buyer gives up and closes the modal.
        (message) => toast.error(declinedOutcome(message).description),
      );
    } catch (err) {
      // Nothing has been charged at this point — the gateway never opened.
      setOutcome(classifyPaymentError(err));
      setSubmitting(false);
    }
  };

  /**
   * "Check again" for a captured-but-unconfirmed payment: re-read the order and
   * move on if the webhook has since settled it.
   */
  const recheckOrder = async () => {
    const orderId = pendingOrderId;
    if (!orderId) return;
    setRechecking(true);
    try {
      const latest = await authedRequest<Order>(`/orders/${orderId}`);
      if (latest.status === "PAID") {
        clear();
        setOutcome(null);
        router.push(`/orders/${orderId}`);
        return;
      }
      toast.info("Still confirming — this can take a minute. We'll keep trying.");
    } catch {
      toast.error("Couldn't reach us just now. Your payment is still safe.");
    } finally {
      setRechecking(false);
    }
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Address <span className="mx-2 text-border-control">/</span> Payment <span className="mx-2 text-border-control">/</span> Confirmation</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">Checkout</h1>
      </div>
      <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold text-foreground">Delivery address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
              <Input {...register("fullName")} placeholder="Jane Mother" />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input
                {...register("phone")}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                aria-invalid={!!errors.phone}
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="Postal code" error={errors.postalCode?.message}>
              <Input {...register("postalCode")} placeholder="560001" />
            </Field>
            <Field label="Address line 1" error={errors.line1?.message} className="sm:col-span-2">
              <Input {...register("line1")} placeholder="Flat / house, street" />
            </Field>
            <Field label="Address line 2 (optional)" error={errors.line2?.message} className="sm:col-span-2">
              <Input {...register("line2")} placeholder="Area, landmark" />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <Input {...register("city")} placeholder="Bengaluru" />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <Input {...register("state")} placeholder="Karnataka" />
            </Field>
            <Field label="Country" error={errors.country?.message}>
              <Input {...register("country")} />
            </Field>
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold text-foreground">Payment method</h2>
          <div className="mt-4">
            <div className="flex items-start gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-4">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-primary">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <div>
                <p className="font-medium text-foreground">Pay securely online</p>
                <p className="text-sm text-muted-foreground">UPI, cards, netbanking &amp; wallets. Your order is confirmed only after payment succeeds.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="h-fit p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-xl font-semibold text-foreground">Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.listingId} className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{i.title}</span>
                <span className="text-foreground">{formatPaise(i.priceInPaise)}</span>
              </div>
            ))}
          </div>
          <div className="my-4 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">{formatPaise(subtotal)}</span>
          </div>
          {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
            {submitting ? "Opening payment…" : `Pay ${formatPaise(subtotal)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Secure online payment. Availability is re-checked before your order is confirmed.
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Read our <Link href="/refunds" className="underline hover:text-foreground">cancellation &amp; refund policy</Link> before you pay.
          </p>
        </Card>
      </form>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Pay securely online</p><p className="text-lg font-bold text-foreground">{formatPaise(subtotal)}</p></div>
          <button type="submit" form="checkout-form" disabled={submitting} className="inline-flex h-12 items-center rounded-full bg-primary px-7 font-semibold text-primary-foreground disabled:opacity-50">{submitting ? "Opening…" : "Pay now"}</button>
        </div>
      </div>

      <PaymentVerifyingOverlay open={verifying} />
      <PaymentStatusModal
        outcome={outcome}
        retrying={rechecking}
        onRetry={outcome?.charged ? () => void recheckOrder() : undefined}
        onClose={() => {
          const settled = outcome?.charged;
          setOutcome(null);
          // A charged order exists and holds its listings — send the buyer to it
          // rather than back to a form that would fail on RESERVED items.
          if (settled && pendingOrderId) {
            clear();
            router.push(`/orders/${pendingOrderId}`);
          }
        }}
        secondary={
          outcome?.kind === "session-expired" ? (
            <Link href="/login?next=/checkout" className={buttonVariants()}>
              Sign in
            </Link>
          ) : outcome?.kind === "item-unavailable" ? (
            <Link href="/listings" className={buttonVariants()}>
              Browse listings
            </Link>
          ) : undefined
        }
      />
    </Container>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-0">{label}<span className="mt-1.5 block">{children}</span></Label>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
