"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen, CheckCheck } from "lucide-react";
import type { ContactMessage, ContactMessageStatus } from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const statusStyles: Record<ContactMessageStatus, string> = {
  NEW: "bg-gold/20 text-gold",
  READ: "bg-muted text-muted-foreground",
  RESPONDED: "bg-primary/15 text-primary",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AdminMessagesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: () => authedRequest<ContactMessage[]>("/admin/contact-messages"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactMessageStatus }) =>
      authedRequest<ContactMessage>(`/admin/contact-messages/${id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: (updated) => qc.setQueryData<ContactMessage[]>(["admin-contact-messages"], (old) =>
      old?.map((m) => (m.id === updated.id ? updated : m)),
    ),
  });

  const [expanded, setExpanded] = useState<string | null>(null);

  const open = (message: ContactMessage) => {
    setExpanded((current) => (current === message.id ? null : message.id));
    if (message.status === "NEW") setStatus.mutate({ id: message.id, status: "READ" });
  };

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Support</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Messages</h1>
        <p className="mt-2 text-muted-foreground">Submissions from the &quot;Send us a message&quot; contact form.</p>
      </header>

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <StatePanel title="No messages yet" description="Contact form submissions will show up here." />
      ) : (
        <Card className="divide-y divide-border">
          {data.map((message) => (
            <div key={message.id}>
              <button
                type="button"
                onClick={() => open(message)}
                className="flex w-full flex-wrap items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className="shrink-0">
                  {message.status === "NEW" ? <Mail className="h-4 w-4 text-gold" /> : <MailOpen className="h-4 w-4 text-muted-foreground" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <span className="truncate">{message.subject}</span>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusStyles[message.status])}>
                      {message.status}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{message.name} · {message.email}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(message.createdAt)}</span>
              </button>

              {expanded === message.id && (
                <div className="space-y-3 border-t border-border bg-muted/30 p-4">
                  {message.phone && <p className="text-sm text-muted-foreground">Phone: {message.phone}</p>}
                  <p className="whitespace-pre-wrap text-sm text-foreground">{message.message}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a href={`mailto:${message.email}`} className="inline-flex h-9 items-center rounded-full border border-border-control/60 px-4 text-sm font-medium text-foreground hover:bg-muted">
                      Reply by email
                    </a>
                    {message.status !== "RESPONDED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: message.id, status: "RESPONDED" })}
                      >
                        <CheckCheck className="h-4 w-4" /> Mark responded
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
