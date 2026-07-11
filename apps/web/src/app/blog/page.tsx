import Link from "next/link";
import { Newspaper } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/states";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-text">The Nurture journal</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">Blog</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        Guides on buying and selling preloved baby gear, care tips and stories from our community — coming soon.
      </p>
      <div className="mt-8">
        <StatePanel
          icon={Newspaper}
          title="No posts yet"
          description="We're putting the first articles together. In the meantime, explore the marketplace."
          action={<Link href="/listings" className={buttonVariants()}>Shop preloved</Link>}
        />
      </div>
    </Container>
  );
}
