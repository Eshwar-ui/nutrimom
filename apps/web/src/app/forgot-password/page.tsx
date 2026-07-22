"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@nutrimom/shared";
import { request, ApiError } from "@/lib/api";
import { Container, Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    try {
      await request("/auth/forgot-password", { method: "POST", body: data });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong");
    }
  };

  return (
    <Container className="grid min-h-[calc(100dvh-8rem)] items-center py-12">
      <Card className="mx-auto w-full max-w-md p-7 sm:p-9">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10"><MailCheck className="h-7 w-7 text-primary" /></div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">Check your email</h2>
            <p className="mt-2 text-muted-foreground">If an account exists for that address, we&apos;ve sent a link to reset your password. It expires in 30 minutes.</p>
            <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-accent-text hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-3xl font-semibold text-foreground">Reset your password</h2>
            <p className="mt-1 text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
              <div>
                <Label htmlFor="fp-email">Email</Label>
                <Input id="fp-email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "fp-email-error" : undefined} {...register("email")} placeholder="you@email.com" />
                {errors.email && <p id="fp-email-error" className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
              </div>
              {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send reset link"}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">Remembered it? <Link href="/login" className="font-semibold text-accent-text hover:underline">Sign in</Link></p>
          </>
        )}
      </Card>
    </Container>
  );
}
