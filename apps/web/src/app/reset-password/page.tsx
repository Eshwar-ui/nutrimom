"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError, request } from "@/lib/api";
import { Container, Card, Label, PasswordInput } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";

const formSchema = z.object({ password: z.string().min(8).max(72) });
type FormInput = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Container className="py-16"><PageSkeleton rows={3} /></Container>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput>({ resolver: zodResolver(formSchema) });

  if (!token) {
    return (
      <Container className="py-16 sm:py-24">
        <StatePanel tone="error" title="Invalid reset link" description="This link is missing its token. Request a new one from the forgot-password page." action={<Link href="/forgot-password" className="text-sm font-semibold text-accent-text hover:underline">Request a new link</Link>} />
      </Container>
    );
  }

  const onSubmit = async (data: FormInput) => {
    setError(null);
    try {
      await request("/auth/reset-password", { method: "POST", body: { token, password: data.password } });
      router.push("/login");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong");
    }
  };

  return (
    <Container className="grid min-h-[calc(100dvh-8rem)] items-center py-12">
      <Card className="mx-auto w-full max-w-md p-7 sm:p-9">
        <h2 className="font-display text-3xl font-semibold text-foreground">Choose a new password</h2>
        <p className="mt-1 text-muted-foreground">Make it at least 8 characters.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
          <div>
            <Label htmlFor="rp-password">New password</Label>
            <PasswordInput id="rp-password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "rp-password-error" : undefined} {...register("password")} placeholder="••••••••" />
            {errors.password && <p id="rp-password-error" className="mt-1.5 text-xs text-danger">{errors.password.message}</p>}
          </div>
          {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save new password"}</Button>
        </form>
      </Card>
    </Container>
  );
}
