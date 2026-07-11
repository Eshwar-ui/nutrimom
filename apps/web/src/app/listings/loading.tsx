import { Container } from "@/components/ui/primitives";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ListingsLoading() {
  return (
    <Container className="py-12">
      <Skeleton className="h-10 w-64 rounded-full" />
      <Skeleton className="mt-3 h-4 w-44 rounded-full" />
      <div className="mb-8 mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
