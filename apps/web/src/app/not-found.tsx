import Link from "next/link";
import { Heart } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Heart className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        It may have sold, been taken down, or the link might be off. Let&apos;s get you back to shopping.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/listings"><Button>Shop preloved</Button></Link>
        <Link href="/"><Button variant="outline">Go home</Button></Link>
      </div>
    </Container>
  );
}
