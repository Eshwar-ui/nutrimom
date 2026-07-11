import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { getSellerProfile, getSellerReviews } from "@/lib/listings";
import { ApiError } from "@/lib/api";
import { Container, Card } from "@/components/ui/primitives";
import { ListingCard } from "@/components/listing-card";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const s = await getSellerProfile(id);
    return { title: `${s.name}'s shop` };
  } catch {
    return { title: "Seller" };
  }
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await getSellerProfile(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  const reviews = await getSellerReviews(id).catch(() => []);

  return (
    <Container className="py-12">
      <div className="flex flex-col items-center rounded-[2rem] border-2 border-border bg-surface p-8 text-center card-shadow">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-primary/12 font-display text-3xl font-bold text-primary">
          {seller.name[0]}
        </span>
        <h1 className="mt-4 flex items-center gap-2 font-display text-3xl font-semibold text-foreground">
          {seller.name}
          {seller.isSellerVerified && <BadgeCheck className="h-6 w-6 text-primary" />}
        </h1>
        {seller.city && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {seller.city}
          </p>
        )}
        {seller.bio && <p className="mt-3 max-w-md text-muted-foreground">{seller.bio}</p>}
        {seller.averageRating !== null && (
          <div className="mt-3 flex items-center gap-1.5">
            <StarRow rating={seller.averageRating} />
            <span className="text-sm font-medium text-foreground">{seller.averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({seller.reviewCount} review{seller.reviewCount === 1 ? "" : "s"})
            </span>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Selling since {new Date(seller.memberSince).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
      </div>

      <h2 className="mb-6 mt-10 font-display text-2xl font-semibold text-foreground">
        {seller.listings.length} item{seller.listings.length === 1 ? "" : "s"} for sale
      </h2>
      {seller.listings.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {seller.listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-border p-14 text-center text-muted-foreground">
          Nothing listed right now — check back soon.
        </div>
      )}

      {reviews.length > 0 && (
        <>
          <h2 className="mb-6 mt-12 font-display text-2xl font-semibold text-foreground">
            What buyers say
          </h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StarRow rating={r.rating} />
                    <span className="text-sm font-medium text-foreground">{r.reviewerName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">On {r.listingTitle}</p>
                {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
              </Card>
            ))}
          </div>
        </>
      )}
    </Container>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-3.5 w-3.5", n <= Math.round(rating) ? "fill-gold text-gold" : "text-border")}
        />
      ))}
    </div>
  );
}
