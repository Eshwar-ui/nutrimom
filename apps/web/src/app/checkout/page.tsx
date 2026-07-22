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
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { Container, Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
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
        description: `Order ${order.id.slice(-6).toUpperCase()}`,
        order_id: pay.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: user?.email,
          contact: address.phone,
        },
        theme: { color: "#e8756a" },
        handler: async (resp) => {
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
            setError(
              err instanceof Error
                ? err.message
                : "Payment verification failed",
            );
            setSubmitting(false);
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setSubmitting(false);
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
              <Input {...register("phone")} placeholder="+91 98765 43210" />
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
