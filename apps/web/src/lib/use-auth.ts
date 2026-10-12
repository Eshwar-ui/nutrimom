"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@nutrimom/shared";
import { useAuthStore } from "./auth-store";
import { useAuthHydrated } from "./use-store-hydrated";

/**
 * Client-side auth gate. Waits for the persisted store to hydrate, then
 * redirects to /login (or home, if the role is wrong). `ready` is true only
 * once we're sure the user is allowed — render a placeholder until then.
 */
export function useRequireAuth(role?: Role) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      const next = encodeURIComponent(window.location.pathname);
      router.replace(`/login?next=${next}`);
    } else if (role && user.role !== role) {
      router.replace("/");
    }
  }, [hydrated, user, role, router]);

  const ready = hydrated && !!user && (!role || user.role === role);
  return { ready, hydrated, user };
}
