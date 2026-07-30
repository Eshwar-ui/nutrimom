"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPaise, OrderStatus, type Order, type OrderStatus as OrderStatusType } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { CustomSelect } from "@/components/ui/custom-select";
import { CancelOrderDialog } from "@/components/cancel-order-dialog";

const statusOptions = Object.values(OrderStatus);

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => authedRequest<Order[]>("/admin/orders") });
  const updateStatus = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatusType; reason?: string }) => authedRequest<Order>(`/admin/orders/${id}/status`, { method: "PATCH", body: { status, reason } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); setCancellingOrder(null); },
  });

  // The status dropdown needs a reason before it can submit CANCELLED, so
  // that pick is intercepted here rather than mutating immediately.
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);

  const statusSelect = (order: Order) => (
    <CustomSelect
      id={`order-status-${order.id}`}
      ariaLabel={`Update order ${order.orderNumber} status`}
      value={order.status}
      onChange={(status) =>
        status === "CANCELLED"
          ? setCancellingOrder(order)
          : updateStatus.mutate({ id: order.id, status: status as OrderStatusType })
      }
      options={statusOptions.map((status) => ({ value: status, label: status }))}
      disabled={updateStatus.isPending}
      className="w-40"
    />
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
                  <Link href={`/admin/orders/${order.id}`} className="group">
                    <p className="font-semibold text-foreground group-hover:underline">{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{order.shippingAddress.fullName}</p>
                  </Link>
                  <OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold text-foreground">{formatPaise(order.totalInPaise)}<span className="ml-2 text-xs font-normal text-muted-foreground">{order.paymentMethod === "COD" ? "COD" : "Online"}</span></span>
                  {statusSelect(order)}
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th>Update</Th><Th /></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <Td className="font-medium text-foreground">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">{order.orderNumber}</Link>
                    </Td>
                    <Td>{order.shippingAddress.fullName}</Td>
                    <Td>{formatPaise(order.totalInPaise)}</Td>
                    <Td>{order.paymentMethod === "COD" ? "COD" : "Online"}</Td>
                    <Td><OrderStatusBadge status={order.status} paymentMethod={order.paymentMethod} /></Td>
                    <Td>{statusSelect(order)}</Td>
                    <Td>
                      <Link href={`/admin/orders/${order.id}`} aria-label="View order" className="text-muted-foreground hover:text-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {cancellingOrder && (
        <CancelOrderDialog
          title={`Cancel order ${cancellingOrder.orderNumber}?`}
          pending={updateStatus.isPending}
          onCancel={() => setCancellingOrder(null)}
          onConfirm={(reason) =>
            updateStatus.mutate({ id: cancellingOrder.id, status: "CANCELLED", reason })
          }
        />
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-4 py-3 font-medium">{children}</th>; }
function Td({ children, className }: { children: React.ReactNode; className?: string }) { return <td className={`px-4 py-3 ${className ?? ""}`}>{children}</td>; }
