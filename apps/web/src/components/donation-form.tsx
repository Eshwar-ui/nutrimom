"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Gift, LogIn } from "lucide-react";
import {
  HANDOVER_PREFERENCE_LABELS,
  conditionLabels,
  donationOfferInputSchema,
  type AuthUser,
  type DonationOffer,
  type DonationOfferInput,
  type DonationStatus,
} from "@nutrimom/shared";
import { authedRequest, ApiError } from "@/lib/api";
import { getCategories } from "@/lib/listings";
import { loginHref, registerHref } from "@/lib/auth-redirect";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/lib/use-store-hydrated";
import { toast } from "@/lib/toast-store";
import { Card, Input, Label, Textarea } from "@/components/ui/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { ImageUploader } from "@/components/image-uploader";
import { CityCombobox } from "@/components/city-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DONATE_PATH = "/preloved/donate";

/** How each stage reads to the donor (the admin queue uses DONATION_STATUS_LABELS). */
const DONOR_STATUS: Record<DonationStatus, string> = {
  NEW: "Received",
  CONTACTED: "We've been in touch",
  MATCHED: "Matched with a mom",
  COMPLETED: "Handed over — thank you!",
  DECLINED: "Not accepted this time",
};

/**
 * The donation offer form. Signed-out visitors get a sign-in prompt that
 * brings them straight back here; the explainer around it stays public.
 */
export function DonationForm() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();

  if (!hydrated) {
    return <Skeleton className="h-96 w-full rounded-card" />;
  }
  if (!user) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Gift className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sign in to offer an item</h3>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            We ask you to sign in so we can reach you about your offer and you can see how it&apos;s going. You&apos;ll come
            straight back to this form.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={loginHref(DONATE_PATH)} className={buttonVariants()}>
            <LogIn className="h-4 w-4" /> Sign in to donate
          </Link>
          <Link href={registerHref(DONATE_PATH)} className={buttonVariants({ variant: "outline" })}>
            Create an account
          </Link>
        </div>
      </Card>
    );
  }
  // Mounted only once the user is known, so the prefill below is read on the
  // form's first render rather than racing the auth store's hydration.
  return <DonationFormFields user={user} />;
}

function DonationFormFields({ user }: { user: AuthUser }) {
  const qc = useQueryClient();
  const [sent, setSent] = useState<DonationOffer | null>(null);
  // Bumped to remount the photo uploader with an empty grid after a submit.
  const [round, setRound] = useState(0);

  const defaults: Partial<DonationOfferInput> = {
    contactName: user.name,
    contactEmail: user.email,
    contactPhone: user.whatsappNumber ?? "",
    city: user.city ?? "",
    locality: user.locality ?? "",
    pincode: user.pincode ?? "",
    categoryId: "",
    itemsDescription: "",
    images: [],
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DonationOfferInput>({
    resolver: zodResolver(donationOfferInputSchema),
    defaultValues: defaults,
  });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: mine } = useQuery({
    queryKey: ["my-donations"],
    queryFn: () => authedRequest<DonationOffer[]>("/donations/mine"),
  });

  const submit = useMutation({
    mutationFn: (data: DonationOfferInput) =>
      authedRequest<DonationOffer>("/donations", { method: "POST", body: data }),
    onSuccess: (offer) => {
      setSent(offer);
      qc.invalidateQueries({ queryKey: ["my-donations"] });
      window.scrollTo({ top: (document.getElementById("donate-form")?.offsetTop ?? 0) - 80, behavior: "smooth" });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError && err.status === 429
          ? "You've sent a few offers in a row — please wait a minute and try again."
          : err instanceof Error
            ? err.message
            : "We couldn't send your offer. Please try again.",
      );
    },
  });

  const onImages = useCallback(
    (urls: string[]) => setValue("images", urls, { shouldDirty: true }),
    [setValue],
  );

  const field = (name: keyof DonationOfferInput) => ({
    "aria-invalid": !!errors[name] || undefined,
    "aria-describedby": errors[name] ? `donate-${name}-error` : undefined,
  });
  const fieldError = (name: keyof DonationOfferInput) =>
    errors[name]?.message ? (
      <p id={`donate-${name}-error`} className="mt-1.5 text-xs text-danger">
        {String(errors[name]?.message)}
      </p>
    ) : null;

  if (sent) {
    return (
      <Card className="flex flex-col items-center p-8 text-center sm:p-10">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.6} />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-foreground">
          Thank you, {sent.contactName.split(" ")[0]}!
        </h3>
        <p className="mt-2 max-w-md leading-relaxed text-muted-foreground">
          Your offer is with our team. We&apos;ll call or message you on {sent.contactPhone}{" "}to talk it through, then
          let you know once we&apos;ve found a mom who needs it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              reset({ ...defaults, city: sent.city, locality: sent.locality ?? "", pincode: sent.pincode });
              setRound((r) => r + 1);
              setSent(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" /> Offer another item
          </Button>
          <Link href="/listings" className={buttonVariants({ variant: "ghost" })}>
            Browse preloved
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <form onSubmit={handleSubmit((data) => submit.mutate(data))} noValidate>
          <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
            <legend className="sr-only">Your item</legend>
            <div className="sm:col-span-2">
              <Label htmlFor="donate-itemsDescription">What would you like to donate?</Label>
              <Textarea
                id="donate-itemsDescription"
                rows={4}
                placeholder="e.g. A bag of 0–6 month onesies and two swaddles, washed and folded"
                {...field("itemsDescription")}
                {...register("itemsDescription")}
              />
              {fieldError("itemsDescription")}
            </div>
            <div>
              <Label htmlFor="donate-categoryId">Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field: f }) => (
                  <CustomSelect
                    id="donate-categoryId"
                    value={f.value ?? ""}
                    onChange={f.onChange}
                    options={[
                      { value: "", label: "Not sure / a mix" },
                      ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    placeholder="Not sure / a mix"
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor="donate-condition">Condition</Label>
              <Controller
                name="condition"
                control={control}
                render={({ field: f }) => (
                  <CustomSelect
                    id="donate-condition"
                    value={f.value ?? ""}
                    onChange={f.onChange}
                    options={Object.entries(conditionLabels).map(([value, label]) => ({ value, label }))}
                    placeholder="Choose the condition"
                    invalid={!!errors.condition}
                    describedBy={errors.condition ? "donate-condition-error" : undefined}
                  />
                )}
              />
              {fieldError("condition")}
            </div>
            <div className="sm:col-span-2">
              <span className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">Photos</span>
                <span className="text-xs text-muted-foreground">Optional, but they help us match faster</span>
              </span>
              <ImageUploader key={round} onChange={onImages} error={errors.images?.message} max={10} />
            </div>
          </fieldset>

          <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
            <legend className="sr-only">Where and how</legend>
            <div>
              <Label htmlFor="donate-city">City</Label>
              <Controller
                name="city"
                control={control}
                render={({ field: f }) => (
                  <CityCombobox
                    id="donate-city"
                    mode="form"
                    value={f.value ?? ""}
                    onChange={f.onChange}
                    invalid={!!errors.city}
                    describedBy={errors.city ? "donate-city-error" : undefined}
                  />
                )}
              />
              {fieldError("city")}
            </div>
            <div>
              <Label htmlFor="donate-locality">Locality</Label>
              <Input
                id="donate-locality"
                autoComplete="off"
                placeholder="e.g. Koramangala"
                {...field("locality")}
                aria-describedby={errors.locality ? "donate-locality-error" : "donate-locality-help"}
                {...register("locality")}
              />
              {fieldError("locality") ?? (
                <p id="donate-locality-help" className="mt-1.5 text-xs text-muted-foreground">
                  Area or neighbourhood only — never your house address.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="donate-pincode">PIN code</Label>
              <Input
                id="donate-pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                placeholder="e.g. 560034"
                {...field("pincode")}
                {...register("pincode")}
              />
              {fieldError("pincode")}
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium text-foreground">Handover</legend>
              <div className="flex flex-wrap gap-2">
                {Object.entries(HANDOVER_PREFERENCE_LABELS).map(([value, label]) => (
                  <label key={value} className="cursor-pointer">
                    <input type="radio" value={value} className="peer sr-only" {...register("handover")} />
                    <span
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full border border-border-control/60 bg-surface px-4 text-sm font-medium text-foreground transition-colors",
                        "hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40",
                      )}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {fieldError("handover")}
            </fieldset>
          </fieldset>

          <fieldset className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <legend className="sr-only">How we reach you</legend>
            <div>
              <Label htmlFor="donate-contactName">Your name</Label>
              <Input id="donate-contactName" autoComplete="name" {...field("contactName")} {...register("contactName")} />
              {fieldError("contactName")}
            </div>
            <div>
              <Label htmlFor="donate-contactPhone">Mobile number</Label>
              <Input
                id="donate-contactPhone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 98765 43210"
                {...field("contactPhone")}
                {...register("contactPhone")}
              />
              {fieldError("contactPhone")}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="donate-contactEmail">Email</Label>
              <Input
                id="donate-contactEmail"
                type="email"
                autoComplete="email"
                {...field("contactEmail")}
                {...register("contactEmail")}
              />
              {fieldError("contactEmail")}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 border-t border-border bg-surface-2/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="text-xs text-muted-foreground">Only our team sees your number and PIN code.</p>
            <Button type="submit" size="lg" disabled={isSubmitting || submit.isPending}>
              {submit.isPending ? "Sending…" : (
                <>
                  <Gift className="h-4 w-4" /> Send my offer
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {mine && mine.length > 0 && (
        <section aria-labelledby="my-donations">
          <h3 id="my-donations" className="font-semibold text-foreground">Your offers</h3>
          <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
            {mine.map((offer) => (
              <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{offer.itemsDescription}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(offer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                  <span className="font-semibold text-foreground">{DONOR_STATUS[offer.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
