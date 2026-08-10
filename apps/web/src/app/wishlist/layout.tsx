import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Your wishlist");

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
