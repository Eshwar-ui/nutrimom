-- Admin-configurable order cancellation rules (cutoff window, reason codes,
-- refund percentage) + the reason recorded against a cancelled order.

ALTER TABLE "Order" ADD COLUMN "cancellationReason" TEXT;

CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "cutoffHours" INTEGER NOT NULL DEFAULT 24,
    "reasonCodes" TEXT[] NOT NULL DEFAULT ARRAY['Changed my mind','Ordered by mistake','Found a better price elsewhere','Seller delay','Other']::TEXT[],
    "refundPercentage" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- Seed the single global row with the column defaults above.
INSERT INTO "CancellationPolicy" ("id", "updatedAt") VALUES ('global', now());
