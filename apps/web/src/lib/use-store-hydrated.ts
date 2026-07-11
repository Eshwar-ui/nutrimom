"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "./auth-store";
import { useCartStore } from "./cart-store";

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (callback: () => void) => () => void;
  };
};

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
