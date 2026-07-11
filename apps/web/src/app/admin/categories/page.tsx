"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { categoryInputSchema, type Category, type CategoryInput } from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import { Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => authedRequest<Category[]>("/categories"),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const save = useMutation({
    mutationFn: ({ id, dto }: { id?: string; dto: CategoryInput }) =>
      id
        ? authedRequest<Category>(`/admin/categories/${id}`, { method: "PATCH", body: dto })
        : authedRequest<Category>("/admin/categories", { method: "POST", body: dto }),
    onSuccess: (_data, variables) => {
      invalidate();
      setEditing(null);
      setError(null);
      toast.success(variables.id ? "Category updated" : "Category created");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Something went wrong"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => authedRequest(`/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success("Category deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't delete this category"),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Catalog structure</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Categories</h1></div>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditing("new"); setError(null); }}>
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {editing && (
        <CategoryForm
          initial={editing === "new" ? undefined : editing}
          error={error}
          pending={save.isPending}
          onCancel={() => { setEditing(null); setError(null); }}
          onSubmit={(dto) => save.mutate({ id: editing === "new" ? undefined : editing.id, dto })}
        />
      )}

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <StatePanel title="No categories yet" description="Create the first category to organize marketplace listings." />
      ) : (
        <Card className="divide-y divide-border">
          {data.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-sm text-muted-foreground">/{c.slug}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(c); setError(null); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() => {
                  if (window.confirm(`Delete "${c.name}"?`)) remove.mutate(c.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function CategoryForm({
  initial,
  error,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Category;
  error: string | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (dto: CategoryInput) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: { name: initial?.name ?? "", slug: initial?.slug ?? "" },
  });

  return (
    <Card className="mb-4 p-5">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input {...register("name")} placeholder="Strollers" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <Label>Slug</Label>
          <Input {...register("slug")} placeholder="strollers" />
          {errors.slug && <p className="mt-1 text-xs text-danger">{errors.slug.message}</p>}
        </div>
        {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={onCancel}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
