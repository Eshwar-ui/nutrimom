"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { formatPaise, MEMBERSHIP_PLANS, type AdminUserDetail } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { cn } from "@/lib/utils";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => authedRequest<AdminUserDetail>(`/admin/users/${id}`),
    retry: false,
  });

  if (isLoading) return <PageSkeleton rows={4} />;
  if (error || !user) {
    return (
      <StatePanel
        tone="error"
        title="User not found"
        description="They may have been removed, or the link might be wrong."
        action={
          <Link href="/admin/users" className="text-sm underline">
            Back to users
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <header className="mt-4 mb-7 flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/12 text-xl font-bold text-primary">
          {user.name[0]}
        </span>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {user.name}
            {user.isSellerVerified && <BadgeCheck className="h-6 w-6 text-primary" />}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email} · Joined {fmtDate(user.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Recent listings</h2>
            {user.recentListings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No listings created.</p>
            ) : (
              <div className="space-y-3">
                {user.recentListings.map((l) => (
                  <Link
                    key={l.id}
                    href={`/admin/listings/${l.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">{l.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <ListingStatusBadge status={l.status} />
                      <span className="text-sm font-medium text-foreground">{formatPaise(l.sellingPriceInPaise)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Recent orders (as buyer)</h2>
            {user.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders placed.</p>
            ) : (
              <div className="space-y-3">
                {user.recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/50"
                  >
                    <span className="text-sm text-foreground">{o.orderNumber}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      <span className="text-sm font-medium text-foreground">{formatPaise(o.totalInPaise)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Recent sales (as seller)</h2>
            {user.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items sold.</p>
            ) : (
              <div className="space-y-3">
                {user.recentSales.map((s, i) => (
                  <Link
                    key={`${s.orderId}-${i}`}
                    href={`/admin/orders/${s.orderId}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">{s.listingTitle}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <OrderStatusBadge status={s.orderStatus} />
                      <span className="text-sm font-medium text-foreground">{formatPaise(s.unitPriceInPaise)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Contact</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Email" value={user.email} />
              <Row label="WhatsApp" value={user.whatsappNumber ?? "—"} />
              <Row label="City" value={user.city ?? "—"} />
              <Row label="Role" value={user.role} />
            </dl>
            {user.bio && (
              <>
                <div className="my-3 border-t border-border" />
                <p className="text-sm leading-relaxed text-muted-foreground">{user.bio}</p>
              </>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Seller status</h2>
            <dl className="space-y-2 text-sm">
              <Row
                label="Verified"
                value={user.isSellerVerified ? "Yes" : user.sellerVerificationRequestedAt ? "Requested" : "No"}
              />
              <Row label="Registered" value={user.registrationPaidAt ? fmtDate(user.registrationPaidAt) : "Not paid"} />
              <Row label="Listings" value={String(user.listingCount)} />
            </dl>
            {user.membership && (
              <>
                <div className="my-3 border-t border-border" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{MEMBERSHIP_PLANS[user.membership.plan].label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      user.membership.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {user.membership.active ? "Active" : "Expired"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.membership.active ? "Expires" : "Expired"} {fmtDate(user.membership.expiresAt)}
                </p>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-foreground">{value}</dd>
    </div>
  );
}
