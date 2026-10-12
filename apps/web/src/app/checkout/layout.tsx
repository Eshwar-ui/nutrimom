import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Checkout");

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
