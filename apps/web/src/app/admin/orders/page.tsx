"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPaise, OrderStatus, type Order, type OrderStatus as OrderStatusType } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

const statusOptions = Object.values(OrderStatus);

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => authedRequest<Order[]>("/admin/orders") });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatusType }) => authedRequest<Order>(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const statusSelect = (order: Order) => (
    <select
      aria-label={`Update order ${order.id.slice(-8)} status`}
      value={order.status}
      disabled={updateStatus.isPending}
      onChange={(event) => updateStatus.mutate({ id: order.id, status: event.target.value as OrderStatusType })}
      className="h-10 rounded-lg border border-border-control/60 bg-surface px-2 text-sm text-foreground"
    >
      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
    </select>
  );

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Fulfilment</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Orders</h1>
        <p className="mt-2 text-muted-foreground">Review customer orders and update handover progress.</p>
      </header>

      {isLoading ? <PageSkeleton rows={4} /> : !orders?.length ? (
        <StatePanel title="No orders yet" description="Paid and pending marketplace orders will appear here." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold text-foreground">#{order.id.slice(-8).toUpperCase()}</p><p className="mt-1 text-sm text-muted-foreground">{order.shippingAddress.fullName}</p></div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold text-foreground">{formatPaise(order.totalInPaise)}</span>
                  {statusSelect(order)}
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th><Th>Update</Th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <Td className="font-medium text-foreground">#{order.id.slice(-8).toUpperCase()}</Td>
                    <Td>{order.shippingAddress.fullName}</Td>
                    <Td>{formatPaise(order.totalInPaise)}</Td>
                    <Td><OrderStatusBadge status={order.status} /></Td>
                    <Td>{statusSelect(order)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 font-medium">{children}</th>; }
function Td({ children, className }: { children: React.ReactNode; className?: string }) { return <td className={`px-4 py-3 ${className ?? ""}`}>{children}</td>; }
