import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthTokens, AuthUser } from "@nutrimom/shared";
import { useCartStore } from "./cart-store";

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

// ponytail: tokens live in localStorage — simple and works. Known ceiling:
// XSS-readable. Move the refresh token to an httpOnly cookie if that matters.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setAuth: (user, tokens) => set({ user, tokens }),
      setTokens: (tokens) => set({ tokens }),
      setUser: (user) => set({ user }),
      logout: () => {
        // The cart is per-person — don't leak it to the next user on this device.
        useCartStore.getState().clear();
        set({ user: null, tokens: null });

        if (typeof window === "undefined") return;

        // Clear all site cache on logout so no prior-session data survives.
        try {
          window.localStorage.clear();
          window.sessionStorage.clear();
        } catch {
          // Storage can throw in private mode / when blocked — logout still proceeds.
        }
        // Purge any Cache Storage (service worker / fetch caches) if present.
        if ("caches" in window) {
          window.caches
            .keys()
            .then((keys) => Promise.all(keys.map((k) => window.caches.delete(k))))
            .catch(() => {});
        }
        // Hard-navigate home so Next.js's router/RSC cache is dropped too — a
        // client-side transition would keep serving the old user's cached pages.
        window.location.href = "/";
      },
    }),
    {
      name: "nutrimom-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
