"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { useWishlistStore } from "@/lib/wishlist-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  // Logout and session expiry reload the page, which already drops this
  // in-memory cache. This covers the paths that don't reload (an expired
  // session noticed while on /login) and any future one: whenever the signed-in
  // user goes away or changes, nothing cached for the previous one survives.
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.user && state.user?.id !== prev.user.id) {
          client.clear();
          useWishlistStore.getState().reset();
        }
      }),
    [client],
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
