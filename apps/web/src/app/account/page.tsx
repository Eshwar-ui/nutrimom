"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  profileUpdateSchema,
  type AuthUser,
  type ProfileUpdateInput,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useRequireAuth } from "@/lib/use-auth";
import { Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountPage() {
  const { ready, user } = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  const requestVerification = useMutation({
    mutationFn: () => authedRequest<AuthUser>("/users/me/request-seller-verification", { method: "POST" }),
    onSuccess: (updated) => {
      setUser(updated);
      qc.invalidateQueries();
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProfileUpdateInput>({
      resolver: zodResolver(profileUpdateSchema),
      values: {
        name: user?.name ?? "",
        whatsappNumber: user?.whatsappNumber ?? "",
        city: user?.city ?? "",
        bio: user?.bio ?? "",
      },
    });

  if (!ready || !user) return <PageSkeleton rows={4} />;

  const onSubmit = async (dto: ProfileUpdateInput) => {
    const updated = await authedRequest<AuthUser>("/users/me", { method: "PATCH", body: dto });
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your seller profile and marketplace trust." />

      <Card className="flex items-center gap-4 p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {user.isSellerVerified ? <BadgeCheck className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </span>
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {user.isSellerVerified
              ? "You're a verified seller"
              : user.sellerVerificationRequestedAt
                ? "Verification requested"
                : "Not yet a verified seller"}
          </p>
          <p className="text-sm text-muted-foreground">
            {user.isSellerVerified
              ? "The verified badge shows on your listings and shop page."
              : user.sellerVerificationRequestedAt
                ? "An admin will review your account soon."
                : "Verified sellers get a trust badge buyers can see."}
          </p>
        </div>
        {!user.isSellerVerified && !user.sellerVerificationRequestedAt && (
          <Button
            variant="outline"
            size="sm"
            disabled={requestVerification.isPending}
            onClick={() => requestVerification.mutate()}
          >
            {requestVerification.isPending ? "Requesting…" : "Request verification"}
          </Button>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">Profile &amp; seller details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your WhatsApp and city help buyers reach you about your listings.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="profile-whatsapp">WhatsApp number</Label>
            <Input id="profile-whatsapp" autoComplete="tel" aria-invalid={!!errors.whatsappNumber} {...register("whatsappNumber")} placeholder="+91 98765 43210" />
            {errors.whatsappNumber && <p className="mt-1 text-xs text-danger">{errors.whatsappNumber.message}</p>}
          </div>
          <div>
            <Label htmlFor="profile-city">City</Label>
            <Input id="profile-city" autoComplete="address-level2" {...register("city")} placeholder="Bengaluru" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="profile-bio">Short bio</Label>
            <Textarea id="profile-bio" {...register("bio")} rows={3} placeholder="A line about you as a seller…" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
