"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type AuthResponse, type LoginInput } from "@nutrimom/shared";
import { request, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Container, Card, Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      const response = await request<AuthResponse>("/auth/login", { method: "POST", body: data });
      setAuth(response.user, response.tokens);
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next ?? (response.user.role === "ADMIN" ? "/admin" : "/account"));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong");
    }
  };

  return (
    <Container className="grid min-h-[calc(100dvh-8rem)] items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden max-w-xl lg:block">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">Your marketplace space</p>
        <h1 className="mt-4 max-w-lg font-display text-5xl font-semibold leading-[1.04] text-foreground">Pick up where your family left off.</h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">Manage saved finds, orders, seller messages and the gear your little one has outgrown.</p>
      </div>
      <Card className="w-full max-w-md justify-self-center p-7 sm:p-9">
        <h2 className="font-display text-3xl font-semibold text-foreground">Welcome back</h2>
        <p className="mt-1 text-muted-foreground">Sign in to your account.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "login-email-error" : undefined} {...register("email")} placeholder="you@email.com" />
            {errors.email && <p id="login-email-error" className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "login-password-error" : undefined} {...register("password")} placeholder="••••••••" />
            {errors.password && <p id="login-password-error" className="mt-1.5 text-xs text-danger">{errors.password.message}</p>}
          </div>
          {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link href="/register" className="font-semibold text-accent-text hover:underline">Create an account</Link></p>
      </Card>
    </Container>
  );
}
