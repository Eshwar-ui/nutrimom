import { Container } from "@/components/ui/primitives";
import { PageSkeleton } from "@/components/ui/states";

export default function Loading() {
  return <Container className="py-12 sm:py-16"><PageSkeleton rows={4} /></Container>;
}
