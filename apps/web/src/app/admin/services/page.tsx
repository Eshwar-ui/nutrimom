"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import {
  SERVICE_GROUP_LABELS,
  formatPaise,
  resolvePackagePrice,
  type ServiceGroup,
  type ServicePackage,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { revalidatePublicPages } from "@/lib/revalidate";
import { errorMessage, formatDateTime, isPast } from "@/lib/admin-content";
import { toast } from "@/lib/toast-store";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { AdminPageHeader, ConfirmDeleteDialog, StatusChip } from "@/components/admin-form";
import { ServicePackageEditor, packageToInput } from "./package-editor";

const QUERY_KEY = ["admin-service-packages"];
const GROUPS = Object.keys(SERVICE_GROUP_LABELS) as ServiceGroup[];

type Editing = { pkg?: ServicePackage; group?: ServiceGroup } | null;

export default function AdminServicesPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => authedRequest<ServicePackage[]>("/admin/services/packages"),
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ServicePackage | null>(null);

  // The editor replaces the list in place; without this it opens wherever the
  // list happened to be scrolled, often half-way down the form.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [editing]);

  const afterChange = () => {
    void qc.invalidateQueries({ queryKey: QUERY_KEY });
    // The service pages read these behind a cache window; purge so a price
    // change is live now, and a hidden package is gone now.
    void revalidatePublicPages("services");
  };

  const setActive = useMutation({
    mutationFn: (pkg: ServicePackage) =>
      authedRequest<ServicePackage>(`/admin/services/packages/${pkg.id}`, {
        method: "PUT",
        body: { ...packageToInput(pkg), isActive: !pkg.isActive },
      }),
    onSuccess: (pkg) => {
      afterChange();
      toast.success(pkg.isActive ? `${pkg.name} is live` : `${pkg.name} is hidden from the site`);
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't update this package")),
  });

  const remove = useMutation({
    mutationFn: (pkg: ServicePackage) =>
      authedRequest(`/admin/services/packages/${pkg.id}`, { method: "DELETE" }),
    onSuccess: () => {
      afterChange();
      setDeleting(null);
      toast.success("Package deleted");
    },
    onError: (err) => toast.error(errorMessage(err, "Couldn't delete this package")),
  });

  if (editing) {
    return (
      <div>
        <AdminPageHeader
          eyebrow="Services & prices"
          title={editing.pkg ? `Edit ${editing.pkg.name}` : "New package"}
          description="Prices shown on the yoga, Garbhasanskar and nutrition pages. The preview shows the card exactly as mothers will see it."
        />
        <ServicePackageEditor
          initial={editing.pkg}
          defaultGroup={editing.group}
          onCancel={() => setEditing(null)}
          onSaved={(pkg) => {
            afterChange();
            toast.success(editing.pkg ? "Package saved" : `${pkg.name} created`);
            setEditing(null);
          }}
        />
      </div>
    );
  }

  const packages = data ?? [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Services & prices"
        description="Every session package and its price, offer or introductory label. Booking happens on WhatsApp or the enquiry form — the price a mother was shown is saved on her enquiry."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> New package
          </Button>
        }
      />

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : isError ? (
        <StatePanel
          tone="error"
          title="Couldn't load the packages"
          description="Check your connection and try again."
          action={<Button variant="outline" onClick={() => void refetch()}>Try again</Button>}
        />
      ) : (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const rows = packages.filter((p) => p.group === group);
            return (
              <section key={group} aria-labelledby={`group-${group}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id={`group-${group}`} className="text-lg font-semibold text-foreground">
                    {SERVICE_GROUP_LABELS[group]}
                  </h2>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing({ group })}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
                {rows.length === 0 ? (
                  <p className="rounded-card border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                    No packages in this group — the section stays hidden on the site until one is added.
                  </p>
                ) : (
                  <Card className="divide-y divide-border">
                    {rows.map((pkg) => (
                      <PackageRow
                        key={pkg.id}
                        pkg={pkg}
                        busy={setActive.isPending && setActive.variables?.id === pkg.id}
                        onEdit={() => setEditing({ pkg })}
                        onToggle={() => setActive.mutate(pkg)}
                        onDelete={() => setDeleting(pkg)}
                      />
                    ))}
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title={`Delete ${deleting.name}?`}
          description="It disappears from the site straight away. Enquiries that already quoted it keep their own record of the name and price. To take it off the site for now, hide it instead."
          pending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting)}
        />
      )}
    </div>
  );
}

function PackageRow({
  pkg,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  pkg: ServicePackage;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const price = resolvePackagePrice(pkg);
  const offerEnded = pkg.offerPricePaise != null && isPast(pkg.offerEndsAt);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
          <button type="button" onClick={onEdit} className="truncate text-left hover:text-accent-text">
            {pkg.name}
          </button>
          {!pkg.isActive && <StatusChip>Hidden</StatusChip>}
          {pkg.isBestValue && <StatusChip tone="primary">Best value</StatusChip>}
          {price.label === "SPECIAL_OFFER" && <StatusChip tone="accent">{price.offerLabel}</StatusChip>}
          {price.label === "INTRODUCTORY" && <StatusChip tone="gold">Introductory</StatusChip>}
          {offerEnded && <StatusChip tone="danger">Offer ended</StatusChip>}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className={price.label === "SPECIAL_OFFER" ? "font-semibold text-accent-text" : "font-semibold text-foreground"}>
            {formatPaise(price.pricePaise)}
          </span>
          {price.compareAtPaise !== undefined && (
            <span className="ml-1.5 line-through">{formatPaise(price.compareAtPaise)}</span>
          )}
          {price.offerEndsAt && <> · offer until {formatDateTime(price.offerEndsAt)}</>}
          {" · "}order {pkg.sortOrder}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={pkg.isActive ? `Hide ${pkg.name} from the site` : `Show ${pkg.name} on the site`}
          title={pkg.isActive ? "Hide from the site" : "Show on the site"}
          disabled={busy}
          onClick={onToggle}
        >
          {pkg.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Edit ${pkg.name}`} onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Delete ${pkg.name}`} className="hover:text-danger" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
