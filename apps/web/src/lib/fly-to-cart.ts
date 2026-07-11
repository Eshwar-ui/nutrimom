// Dispatches a "fly to cart" flight from a source element (usually the
// listing image) toward the cart icon. The <FlyToCart> overlay does the rest.

export interface FlyDetail {
  from: { left: number; top: number; width: number; height: number };
  image: string | null;
}

export function flyToCart(el: HTMLElement | null, image: string | null) {
  if (!el || typeof window === "undefined") return;
  const r = el.getBoundingClientRect();
  const detail: FlyDetail = {
    from: { left: r.left, top: r.top, width: r.width, height: r.height },
    image,
  };
  window.dispatchEvent(new CustomEvent("fly-to-cart", { detail }));
}
