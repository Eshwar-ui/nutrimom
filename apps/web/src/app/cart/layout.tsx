import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Your bag");

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
