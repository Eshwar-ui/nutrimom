import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthTokens, AuthUser } from "@nutrimom/shared";

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
      logout: () => set({ user: null, tokens: null }),
    }),
    {
      name: "nutrimom-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
