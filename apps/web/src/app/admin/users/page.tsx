"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { MEMBERSHIP_PLANS, type AdminUser } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// A user counts as a seller once they've shown any seller intent — paid
// registration, requested/gained verification, or already has listings —
// even if they haven't subscribed to a plan yet.
const isSeller = (u: AdminUser) =>
  u.registrationPaidAt !== null ||
  u.isSellerVerified ||
  u.sellerVerificationRequestedAt !== null ||
  u.listingCount > 0;

const tabs = ["Sellers", "Customers"] as const;

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Sellers");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => authedRequest<AdminUser[]>("/admin/users"),
  });

  const verify = useMutation({
    mutationFn: ({ id, isSellerVerified }: { id: string; isSellerVerified: boolean }) =>
      authedRequest(`/admin/users/${id}/verify`, { method: "PATCH", body: { isSellerVerified } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const sellers = (data ?? []).filter(isSeller);
  const customers = (data ?? []).filter((u) => !isSeller(u));
  const rows = tab === "Sellers" ? sellers : customers;

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">People and trust</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Users</h1>
        <p className="mt-2 text-muted-foreground">Review seller verification, membership plans, and marketplace activity.</p>
      </header>

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t} {t === "Sellers" ? `(${sellers.length})` : `(${customers.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <StatePanel title="Nothing here" description={tab === "Sellers" ? "No sellers yet." : "No plain customers yet."} />
      ) : (
        <Card className="divide-y divide-border">
          {rows.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 font-bold text-primary">
                {u.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                  {u.name}
                  {u.isSellerVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  {u.role === "ADMIN" && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Admin</span>
                  )}
                  {!u.isSellerVerified && u.sellerVerificationRequestedAt && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">Requested</span>
                  )}
                  {u.membership && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        u.membership.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {MEMBERSHIP_PLANS[u.membership.plan].label} · {u.membership.active ? "Active" : "Expired"}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {u.email} · {u.city ?? "—"} · {u.listingCount} listing(s)
                </p>
                {tab === "Sellers" && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {u.registrationPaidAt ? `Registered ${fmtDate(u.registrationPaidAt)}` : "Not registered yet"}
                    {u.membership && ` · Plan ${u.membership.active ? "expires" : "expired"} ${fmtDate(u.membership.expiresAt)}`}
                  </p>
                )}
              </div>
              {u.role !== "ADMIN" && tab === "Sellers" && (
                <Button
                  variant={u.isSellerVerified ? "ghost" : "outline"}
                  size="sm"
                  disabled={!u.registrationPaidAt && !u.isSellerVerified}
                  onClick={() => verify.mutate({ id: u.id, isSellerVerified: !u.isSellerVerified })}
                >
                  {u.isSellerVerified
                    ? "Unverify"
                    : u.registrationPaidAt
                      ? "Verify seller"
                      : "Awaiting payment"}
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
