import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, variant = "info") => {
    const id = ++nextId;
    set({ toasts: [...get().toasts, { id, message, variant }] });
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/**
 * A toast that has to survive a full page load — logout and session expiry
 * hard-navigate (to drop the previous user's cached data), which wipes the
 * in-memory store above. Parked in sessionStorage and shown by the Toaster
 * on the next mount via `consumeFlashToast`.
 */
const FLASH_KEY = "nutrimom-flash-toast";

export function flashToast(message: string, variant: ToastVariant = "info") {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, variant }));
  } catch {
    // Storage blocked (private mode etc.) — the message is a nicety, not state.
  }
}

/** Shows, once, a toast parked by `flashToast`. Safe to call repeatedly. */
export function consumeFlashToast() {
  if (typeof window === "undefined") return;
  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(FLASH_KEY);
    window.sessionStorage.removeItem(FLASH_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const { message, variant } = JSON.parse(raw) as { message?: unknown; variant?: unknown };
    if (typeof message !== "string" || !message) return;
    const safeVariant: ToastVariant =
      variant === "success" || variant === "error" ? variant : "info";
    useToastStore.getState().push(message, safeVariant);
  } catch {
    // Malformed entry — drop it.
  }
}

/** Fire-and-forget toast helpers — call from anywhere, no hook needed. */
export const toast = {
  success: (message: string) => useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
  info: (message: string) => useToastStore.getState().push(message, "info"),
};
