import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Each preloved item is a single unit — no quantity.
export interface CartItem {
  listingId: string;
  title: string;
  image: string | null;
  priceInPaise: number;
  city: string;
  sellerName: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (listingId: string) => void;
  has: (listingId: string) => boolean;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) =>
          state.items.some((i) => i.listingId === item.listingId)
            ? state
            : { items: [...state.items, item] },
        ),
      removeItem: (listingId) =>
        set((state) => ({
          items: state.items.filter((i) => i.listingId !== listingId),
        })),
      has: (listingId) => get().items.some((i) => i.listingId === listingId),
      clear: () => set({ items: [] }),
    }),
    {
      name: "nurture-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const cartCount = (s: CartState) => s.items.length;
export const cartSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.priceInPaise, 0);
