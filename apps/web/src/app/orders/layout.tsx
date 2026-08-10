import { privateMetadata } from "@/lib/seo";

// Order detail pages are per-buyer and reachable only with their own token —
// never anything a crawler should hold on to.
export const metadata = privateMetadata("Your order");

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
