"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  profileUpdateSchema,
  type AuthUser,
  type ProfileUpdateInput,
} from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast-store";
import { useAuthStore } from "@/lib/auth-store";
import { useRequireAuth } from "@/lib/use-auth";
import { Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageSkeleton } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountPage() {
  const { ready, user } = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const qc = useQueryClient();

  const requestVerification = useMutation({
    mutationFn: () => authedRequest<AuthUser>("/users/me/request-seller-verification", { method: "POST" }),
    onSuccess: (updated) => {
      setUser(updated);
      qc.invalidateQueries();
      toast.success("Verification requested — an admin will review your account.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't send your request. Please try again."),
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
    setSubmitError(null);
    try {
      const updated = await authedRequest<AuthUser>("/users/me", { method: "PATCH", body: dto });
      setUser(updated);
      setShowSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Couldn't save your profile. Please try again.",
      );
    }
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
          {submitError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger sm:col-span-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Card>

      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} labelledBy="profile-saved-title">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 id="profile-saved-title" className="mt-4 font-display text-2xl font-semibold text-foreground">
            Profile saved
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Your seller details are up to date. Buyers will see your latest info on your listings and shop page.
          </p>
          <Button className="mt-6 w-full" onClick={() => setShowSuccess(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
