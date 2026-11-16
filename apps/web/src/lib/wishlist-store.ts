import { create } from "zustand";
import { authedRequest } from "./api";

interface WishlistState {
  ids: string[];
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (listingId: string) => Promise<void>;
  /**
   * Makes sure `listingId` is saved — never un-saves. For resuming a "save"
   * started before sign-in, where a toggle could undo a save that already
   * happened (a double-run effect, a second tab, a stale list).
   */
  ensureSaved: (listingId: string) => Promise<void>;
  has: (listingId: string) => boolean;
  reset: () => void;
}

// Shared by every caller while a load is running, so the header's load on
// sign-in and an ensureSaved right after it can't overwrite each other with
// lists fetched at different moments.
let loadInFlight: Promise<void> | null = null;
// Listings an ensureSaved is currently writing, so repeat calls are no-ops.
const ensuring = new Set<string>();

// Server is the source of truth; we mirror ids for instant heart toggles.
export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  loaded: false,
  load: () => {
    loadInFlight ??= authedRequest<string[]>("/wishlist/ids")
      .then((ids) => set({ ids, loaded: true }))
      .catch(() => set({ loaded: true }))
      .finally(() => {
        loadInFlight = null;
      });
    return loadInFlight;
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
  ensureSaved: async (listingId) => {
    if (ensuring.has(listingId)) return;
    ensuring.add(listingId);
    try {
      if (!get().loaded) await get().load();
      if (get().ids.includes(listingId)) return;
      set({ ids: [...get().ids, listingId] });
      try {
        // The API only exposes a toggle. If our list was stale and the item
        // was in fact already saved, the first call un-saves it — so toggle
        // back. Either way it ends saved.
        const { wishlisted } = await authedRequest<{ wishlisted: boolean }>(
          "/wishlist/toggle",
          { method: "POST", body: { listingId } },
        );
        if (!wishlisted) {
          await authedRequest("/wishlist/toggle", {
            method: "POST",
            body: { listingId },
          });
        }
      } catch (err) {
        set({ ids: get().ids.filter((i) => i !== listingId) });
        throw err;
      }
    } finally {
      ensuring.delete(listingId);
    }
  },
  has: (listingId) => get().ids.includes(listingId),
  reset: () => set({ ids: [], loaded: false }),
}));
