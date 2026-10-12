import { pageMetadata } from "@/lib/seo";

// The page itself is a client component (it reads the seller billing gate), so
// its metadata has to live in a server layout.
export const metadata = pageMetadata({
  title: "Sell your preloved baby & kids items",
  description:
    "Turn outgrown strollers, clothes, toys and maternity wear into cash. List in minutes, reach moms across India, and ship with a marketplace label.",
  path: "/sell",
});

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
