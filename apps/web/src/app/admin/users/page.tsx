"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import type { AdminUser } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => authedRequest<AdminUser[]>("/admin/users"),
  });

  const verify = useMutation({
    mutationFn: ({ id, isSellerVerified }: { id: string; isSellerVerified: boolean }) =>
      authedRequest(`/admin/users/${id}/verify`, { method: "PATCH", body: { isSellerVerified } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-foreground">Users</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <Card className="divide-y divide-border">
          {(data ?? []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/12 font-bold text-primary">
                {u.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  {u.name}
                  {u.isSellerVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  {u.role === "ADMIN" && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Admin</span>
                  )}
                  {!u.isSellerVerified && u.sellerVerificationRequestedAt && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">Requested</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {u.email} · {u.city ?? "—"} · {u.listingCount} listing(s)
                </p>
              </div>
              {u.role !== "ADMIN" && (
                <Button
                  variant={u.isSellerVerified ? "ghost" : "outline"}
                  size="sm"
                  onClick={() => verify.mutate({ id: u.id, isSellerVerified: !u.isSellerVerified })}
                >
                  {u.isSellerVerified ? "Unverify" : "Verify seller"}
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
