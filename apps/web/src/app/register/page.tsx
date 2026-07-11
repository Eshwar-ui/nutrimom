"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type AuthResponse, type RegisterInput } from "@nutrimom/shared";
import { request, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Container, Card, Input, Label, PasswordInput } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      const response = await request<AuthResponse>("/auth/register", { method: "POST", body: data });
      setAuth(response.user, response.tokens);
      router.push("/account");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong");
    }
  };

  return (
    <Container className="grid min-h-[calc(100dvh-8rem)] items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden max-w-xl lg:block">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Buy, sell, pass it on</p>
        <h1 className="mt-4 max-w-lg font-display text-5xl font-semibold leading-[1.04] text-foreground">Make more room for what comes next.</h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">Save local finds, buy securely, and list the baby gear your family no longer needs.</p>
      </div>
      <Card className="w-full max-w-md justify-self-center p-7 sm:p-9">
        <h2 className="font-display text-3xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-1 text-muted-foreground">It takes less than a minute.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
          <div>
            <Label htmlFor="register-name">Name</Label>
            <Input id="register-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "register-name-error" : undefined} {...register("name")} placeholder="Your name" />
            {errors.name && <p id="register-name-error" className="mt-1.5 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="register-email">Email</Label>
            <Input id="register-email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "register-email-error" : undefined} {...register("email")} placeholder="you@email.com" />
            {errors.email && <p id="register-email-error" className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="register-password">Password</Label>
            <PasswordInput id="register-password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="register-password-help register-password-error" {...register("password")} placeholder="At least 8 characters" />
            <p id="register-password-help" className="mt-1.5 text-xs text-muted-foreground">Use 8–72 characters.</p>
            {errors.password && <p id="register-password-error" className="mt-1.5 text-xs text-danger">{errors.password.message}</p>}
          </div>
          {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</Button>
        </form>
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">By creating an account, you agree to our <Link href="/terms" className="font-semibold text-accent-text hover:underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-accent-text hover:underline">Privacy Policy</Link>.</p>
        <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-semibold text-accent-text hover:underline">Sign in</Link></p>
      </Card>
    </Container>
  );
}
