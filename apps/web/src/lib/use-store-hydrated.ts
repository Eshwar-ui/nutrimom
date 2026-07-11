"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "./auth-store";
import { useCartStore } from "./cart-store";

type PersistedStore = Pick<typeof useAuthStore, "persist">;

function usePersistHydrated(store: PersistedStore) {
  return useSyncExternalStore(
    (onStoreChange) => store.persist.onFinishHydration(onStoreChange),
    () => store.persist.hasHydrated(),
    () => false,
  );
}

export function useAuthHydrated() {
  return usePersistHydrated(useAuthStore);
}

export function useCartHydrated() {
  return usePersistHydrated(useCartStore);
}
