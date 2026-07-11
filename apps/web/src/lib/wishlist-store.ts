import { create } from "zustand";
import { authedRequest } from "./api";

interface WishlistState {
  ids: string[];
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (listingId: string) => Promise<void>;
  has: (listingId: string) => boolean;
  reset: () => void;
}

// Server is the source of truth; we mirror ids for instant heart toggles.
export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  loaded: false,
  load: async () => {
    try {
      const ids = await authedRequest<string[]>("/wishlist/ids");
      set({ ids, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  toggle: async (listingId) => {
    const had = get().ids.includes(listingId);
    set({
      ids: had
        ? get().ids.filter((i) => i !== listingId)
        : [...get().ids, listingId],
    });
    try {
      await authedRequest("/wishlist/toggle", {
        method: "POST",
        body: { listingId },
      });
    } catch {
      // revert on failure
      set({
        ids: had
          ? [...get().ids, listingId]
          : get().ids.filter((i) => i !== listingId),
      });
    }
  },
  has: (listingId) => get().ids.includes(listingId),
  reset: () => set({ ids: [], loaded: false }),
}));
