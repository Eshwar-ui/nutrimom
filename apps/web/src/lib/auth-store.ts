import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthTokens, AuthUser } from "@nutrimom/shared";
import { useCartStore } from "./cart-store";
import { flashToast, useToastStore, type ToastVariant } from "./toast-store";

export interface LogoutOptions {
  /**
   * Where to land afterwards (a same-site path). Defaults to "/". `null`
   * clears the session but stays on the current page — for when the user is
   * already on /login and a reload would only throw away what they typed.
   */
  redirectTo?: string | null;
  /** A toast to show on the page we land on (it survives the reload). */
  notice?: { message: string; variant?: ToastVariant };
}

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: AuthUser) => void;
  logout: (opts?: LogoutOptions) => void;
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
      logout: (opts) => {
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
        if (opts?.redirectTo === null) {
          // Staying put: nothing reloads, so the in-memory toast is enough.
          // (Query and wishlist caches are dropped by <Providers> on the
          // user -> null transition.)
          if (opts.notice) useToastStore.getState().push(opts.notice.message, opts.notice.variant);
          return;
        }
        // Written after the storage wipe above, or it would be wiped with it.
        if (opts?.notice) flashToast(opts.notice.message, opts.notice.variant);

        // Hard-navigate so Next.js's router/RSC cache and the in-memory React
        // Query cache are dropped too — a client-side transition would keep
        // serving the old user's cached pages and data.
        const target = opts?.redirectTo;
        window.location.href =
          typeof target === "string" && target.startsWith("/") && !target.startsWith("//")
            ? target
            : "/";
      },
    }),
    {
      name: "nutrimom-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
