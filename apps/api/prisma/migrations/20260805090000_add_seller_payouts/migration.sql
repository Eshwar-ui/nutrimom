-- Seller payout ledger. Buyers pay the marketplace, not the seller, so until
-- now there was no record anywhere of what the marketplace owed each seller.
-- One SellerPayout row per (order, seller), created in the same transaction
-- that marks an order PAID.

CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAYABLE', 'PAID', 'CANCELLED');

-- Marketplace commission, in basis points (1000 = 10%) so rates like 5.5%
-- need no floats. Snapshotted onto each payout at sale time.
CREATE TABLE "PayoutPolicy" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "commissionBps" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutPolicy_pkey" PRIMARY KEY ("id")
);

-- Seed the single global row with the column default above.
INSERT INTO "PayoutPolicy" ("id", "updatedAt") VALUES ('global', now());

CREATE TABLE "SellerPayout" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "grossInPaise" INTEGER NOT NULL,
    "commissionBps" INTEGER NOT NULL,
    "commissionInPaise" INTEGER NOT NULL,
    "netInPaise" INTEGER NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SellerPayout_orderId_sellerId_key" ON "SellerPayout"("orderId", "sellerId");
CREATE INDEX "SellerPayout_sellerId_idx" ON "SellerPayout"("sellerId");
CREATE INDEX "SellerPayout_status_idx" ON "SellerPayout"("status");

ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill every order that has already been through checkout, so historical
-- sales are visible in the ledger instead of silently owing nothing. Rate is
-- the default 10% — there was no policy in force when these sold, and the
-- admin can correct individual rows afterwards. Status mirrors the order:
-- delivered money is owed now, in-flight money is held, cancelled owes zero.
-- Orders whose seller account no longer exists are skipped by the join.
INSERT INTO "SellerPayout" (
    "id", "orderId", "sellerId", "status",
    "grossInPaise", "commissionBps", "commissionInPaise", "netInPaise",
    "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    i."orderId",
    i."sellerId",
    CASE o."status"
        WHEN 'DELIVERED' THEN 'PAYABLE'::"PayoutStatus"
        WHEN 'CANCELLED' THEN 'CANCELLED'::"PayoutStatus"
        ELSE 'PENDING'::"PayoutStatus"
    END,
    SUM(i."unitPriceInPaise")::int,
    1000,
    ROUND(SUM(i."unitPriceInPaise")::numeric * 1000 / 10000)::int,
    SUM(i."unitPriceInPaise")::int - ROUND(SUM(i."unitPriceInPaise")::numeric * 1000 / 10000)::int,
    o."createdAt",
    now()
FROM "OrderItem" i
JOIN "Order" o ON o."id" = i."orderId"
JOIN "User" u ON u."id" = i."sellerId"
WHERE o."status" IN ('PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')
GROUP BY i."orderId", i."sellerId", o."status", o."createdAt";
