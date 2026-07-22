"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Tag, PackageCheck, XCircle, ShoppingBag, RotateCcw } from "lucide-react";
import type { Notification, NotificationType } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-auth";
import { Card } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

const icons: Record<NotificationType, typeof Tag> = {
  LISTING_APPROVED: PackageCheck,
  LISTING_REJECTED: XCircle,
  ITEM_SOLD: Tag,
  ORDER_PLACED: ShoppingBag,
  ORDER_CANCELLED: XCircle,
  PAYMENT_REFUNDED: RotateCcw,
};

export default function NotificationsPage() {
  const { ready } = useRequireAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => authedRequest<Notification[]>("/notifications"),
    enabled: ready,
  });

  const readAll = useMutation({
    mutationFn: () => authedRequest("/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!ready) return <PageSkeleton rows={4} />;

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Updates on your orders, listings and seller activity."
        actions={unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => readAll.mutate()} className="gap-1.5">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      />

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : isError ? (
        <StatePanel tone="error" title="Couldn't load notifications" description="Something went wrong reaching the marketplace. Check your connection and try again." action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : !data || data.length === 0 ? (
        <StatePanel title="Nothing new" description="Updates about your orders, listings and seller activity will appear here." />
      ) : (
        <div className="space-y-2">
          {data.map((n) => {
            const Icon = icons[n.type];
            const body = (
              <Card
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors",
                  !n.read && "border-accent/40 bg-accent/5",
                )}
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </Card>
            );
            // A rejected listing isn't publicly viewable — send the seller
            // to their own edit page instead of a link that would 404.
            const href = !n.listingId
              ? null
              : n.type === "LISTING_REJECTED"
                ? `/account/listings/${n.listingId}/edit`
                : `/listings/${n.listingId}`;
            return href ? (
              <Link key={n.id} href={href}>{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
