"use client";

import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/states";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-16 sm:py-24">
      <StatePanel tone="error" title="This page could not load" description="Your account and marketplace data are safe. Try loading this page again." action={<Button onClick={reset}>Try again</Button>} />
    </Container>
  );
}
